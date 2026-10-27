import { db, runTransaction } from "./db";
import { logAudit } from "./auth";

export interface CreditPaymentResult {
  success: boolean;
  duplicate?: boolean;
  already_paid?: boolean;
  credited?: boolean;
  error?: string;
}

/**
 * Idempotent function to credit a paid QRIS payment across webhook & background status check
 */
export function creditPayment(
  trxid: string,
  eventId: string,
  rawPayload: string,
  paidAmount?: number
): CreditPaymentResult {
  // 1. Check duplicate event_id first
  const existingEvent = db
    .prepare("SELECT event_id FROM webhook_events WHERE event_id = ?")
    .get(eventId);
  if (existingEvent) {
    return { success: true, duplicate: true };
  }

  // 2. Fetch local transaction
  const trx = db
    .prepare("SELECT * FROM transaksi WHERE qris_trx_id = ?")
    .get(trxid) as any;

  if (!trx) {
    logAudit("system", "credit_payment_rejected", trxid, "Transaksi tidak ditemukan di database lokal");
    return { success: false, error: "Transaksi tidak ditemukan" };
  }

  if (trx.tipe !== "topup_qris") {
    logAudit("system", "credit_payment_rejected", trxid, `Tipe transaksi bukan topup_qris: ${trx.tipe}`);
    return { success: false, error: "Bukan transaksi QRIS" };
  }

  // If already marked berhasil, record event to prevent future replays and return cleanly
  if (trx.status === "berhasil") {
    try {
      db.prepare(
        "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
      ).run(eventId, trxid, rawPayload.slice(0, 500));
    } catch {}
    return { success: true, already_paid: true };
  }

  // Only allow crediting pending or expired transactions (qris official paid takes precedence over expired)
  if (trx.status !== "pending" && trx.status !== "expired") {
    logAudit("system", "credit_payment_rejected", trxid, `Status transaksi tidak valid untuk kredit: ${trx.status}`);
    return { success: false, error: `Status transaksi tidak valid: ${trx.status}` };
  }

  // 3. Strict amount check
  if (paidAmount !== undefined && paidAmount !== null && Number(paidAmount) > 0) {
    if (Math.round(Number(paidAmount)) !== Math.round(Number(trx.jumlah))) {
      const msg = `Nominal webhook/gateway (Rp ${paidAmount}) tidak cocok dengan tagihan lokal (Rp ${trx.jumlah})`;
      console.warn(`[AUDIT] ${msg} for trxid ${trxid}`);
      logAudit("system", "nominal_mismatch", trxid, msg);
      return { success: false, error: msg };
    }
  }

  // 4. Wrap database mutation in BEGIN IMMEDIATE ... COMMIT
  return runTransaction(() => {
    // Insert webhook_events
    db.prepare(
      "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
    ).run(eventId, trxid, rawPayload.slice(0, 500));

    // Update transaksi to berhasil
    db.prepare(
      "UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(trx.id);

    return { success: true, credited: true };
  });
}

/**
 * Returns current Dompet Utama (Saku) balance for a user
 */
export function getWalletBalance(userId: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(jumlah), 0) as balance FROM transaksi WHERE user_id = ? AND keanggotaan_id IS NULL AND status = 'berhasil'"
    )
    .get(userId) as any;
  return Number(row?.balance || 0);
}

/**
 * Allocate money from Dompet Utama to a Group Pocket (Event Sakune)
 */
export function allocateToGroup(
  userId: string,
  grupId: string,
  amount: number,
  catatan?: string
) {
  if (amount <= 0) throw new Error("Nominal alokasi harus lebih dari 0");

  const currentBalance = getWalletBalance(userId);
  if (currentBalance < amount) {
    throw new Error(`Saldo dompet tidak mencukupi (Tersedia: Rp ${currentBalance.toLocaleString("id-ID")})`);
  }

  // Ensure membership exists
  let member = db
    .prepare("SELECT id FROM keanggotaan WHERE user_id = ? AND grup_id = ?")
    .get(userId, grupId) as any;

  return runTransaction(() => {
    if (!member) {
      const newMemberId = crypto.randomUUID();
      db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
        newMemberId,
        grupId,
        userId
      );
      member = { id: newMemberId };
    }

    const note = catatan || "Alokasi dari Dompet Utama";

    // 1. Deduct from main wallet
    db.prepare(`
      INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
      VALUES (?, ?, NULL, 'alokasi_keluar', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), userId, -amount, note);

    // 2. Add to group pocket
    db.prepare(`
      INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
      VALUES (?, ?, ?, 'alokasi_masuk', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), userId, member.id, amount, note);

    return { success: true, allocated: amount };
  });
}

/**
 * P2P transfer between students by NIM
 */
export function transferToNim(
  senderUserId: string,
  targetNim: string,
  amount: number,
  catatan?: string,
  sumberId: string = "dompet_utama"
) {
  if (amount < 1000) throw new Error("Minimal transfer adalah Rp 1.000");

  const sender = db.prepare("SELECT * FROM users WHERE id = ?").get(senderUserId) as any;
  if (!sender) throw new Error("Pengirim tidak valid");

  const target = db.prepare(`
    SELECT * FROM users 
    WHERE (LOWER(COALESCE(nomor_id, nim)) = LOWER(?) OR LOWER(nim) = LOWER(?) OR (username IS NOT NULL AND LOWER(username) = LOWER(?))) 
      AND aktif = 1
  `).get(targetNim, targetNim, targetNim) as any;

  if (!target) throw new Error(`Pengguna dengan ID / Username ${targetNim} tidak ditemukan`);
  if (target.id === senderUserId) throw new Error("Tidak dapat transfer ke akun sendiri");
  if (target.role !== "mahasiswa" && target.role !== "admin_kelas") {
    throw new Error("Penerima transfer wajib berstatus mahasiswa");
  }

  let sumberNama = "Dompet Utama";
  if (sumberId !== "dompet_utama") {
    const pocket = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(sumberId, senderUserId) as any;
    if (!pocket) throw new Error("Kantong sumber tidak ditemukan");
    if (pocket.saldo < amount) {
      throw new Error(`Saldo Kantong "${pocket.nama}" tidak mencukupi (Tersedia: Rp ${pocket.saldo.toLocaleString("id-ID")})`);
    }
    sumberNama = `Kantong "${pocket.nama}"`;

    return runTransaction(() => {
      // 1. Kurangi saldo kantong
      db.prepare("UPDATE kantong SET saldo = saldo - ? WHERE id = ?").run(amount, sumberId);

      const targetId = target.nomor_id || target.nim;
      const senderId = sender.nomor_id || sender.nim;
      const noteSender = catatan ? `Transfer ke ${target.nama} (${targetId}) dari ${sumberNama}: ${catatan}` : `Transfer ke ${target.nama} (${targetId}) dari ${sumberNama}`;
      const noteReceiver = catatan ? `Transfer dari ${sender.nama} (${senderId}): ${catatan}` : `Transfer dari ${sender.nama} (${senderId})`;

      // 2. Catat riwayat keluar di sender
      db.prepare(`
        INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
        VALUES (?, ?, NULL, 'transfer_keluar', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), senderUserId, -amount, noteSender);

      // 3. Kredit receiver
      db.prepare(`
        INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
        VALUES (?, ?, NULL, 'transfer_masuk', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), target.id, amount, noteReceiver);

      return { success: true, transferred: amount, target_nama: target.nama, sumber: sumberNama };
    });
  }

  const senderBalance = getWalletBalance(senderUserId);
  if (senderBalance < amount) {
    throw new Error(`Saldo Dompet Utama tidak mencukupi (Tersedia: Rp ${senderBalance.toLocaleString("id-ID")})`);
  }

  return runTransaction(() => {
    const targetId = target.nomor_id || target.nim;
    const senderId = sender.nomor_id || sender.nim;
    const noteSender = catatan ? `Transfer ke ${target.nama} (${targetId}): ${catatan}` : `Transfer ke ${target.nama} (${targetId})`;
    const noteReceiver = catatan ? `Transfer dari ${sender.nama} (${senderId}): ${catatan}` : `Transfer dari ${sender.nama} (${senderId})`;

    // Deduct sender
    db.prepare(`
      INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
      VALUES (?, ?, NULL, 'transfer_keluar', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), senderUserId, -amount, noteSender);

    // Credit receiver
    db.prepare(`
      INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at)
      VALUES (?, ?, NULL, 'transfer_masuk', ?, 'berhasil', ?, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), target.id, amount, noteReceiver);

    return { success: true, transferred: amount, target_nama: target.nama, sumber: sumberNama };
  });
}
