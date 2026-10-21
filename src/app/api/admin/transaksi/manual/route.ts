import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser, logAudit } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id, grup_id, target_tujuan, jenis_aksi = "tambah", jumlah, catatan } = await req.json();

  const destination = target_tujuan || (grup_id ? (grup_id.startsWith("grup_") ? grup_id : `grup_${grup_id}`) : "dompet_utama");

  if (!user_id || !destination || !jumlah || !catatan) {
    return NextResponse.json({ error: "Mahasiswa, tujuan kantong/event, nominal, dan catatan wajib diisi" }, { status: 400 });
  }

  const nominal = parseInt(jumlah, 10);
  if (isNaN(nominal) || nominal <= 0) {
    return NextResponse.json({ error: "Nominal harus angka lebih dari 0" }, { status: 400 });
  }

  const isDeduct = jenis_aksi === "kurang";
  const trxId = crypto.randomUUID();

  const student = db.prepare("SELECT id, nama, COALESCE(nomor_id, nim) as nomor_id FROM users WHERE id = ?").get(user_id) as any;
  if (!student) {
    return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  try {
    runTransaction(() => {
      if (destination === "dompet_utama") {
        if (isDeduct) {
          const currentBal = getWalletBalance(user_id);
          if (currentBal < nominal) {
            throw new Error(`Saldo Dompet Utama tidak mencukupi (Tersedia: Rp ${currentBal.toLocaleString("id-ID")})`);
          }
          db.prepare(`
            INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_deduct', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, user_id, -nominal, catatan, user.nama);
        } else {
          db.prepare(`
            INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_add', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, user_id, nominal, catatan, user.nama);
        }
      } else if (destination.startsWith("kantong_")) {
        const kantongId = destination.replace("kantong_", "");
        const kantong = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(kantongId, user_id) as any;
        if (!kantong) throw new Error("Kantong mahasiswa tidak ditemukan");

        if (isDeduct) {
          if (kantong.saldo < nominal) {
            throw new Error(`Saldo Kantong '${kantong.nama}' tidak mencukupi (Tersedia: Rp ${kantong.saldo.toLocaleString("id-ID")})`);
          }
          db.prepare("UPDATE kantong SET saldo = saldo - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nominal, kantongId);
          db.prepare(`
            INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_deduct', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, user_id, -nominal, `[Kantong: ${kantong.nama}] ${catatan}`, user.nama);
        } else {
          db.prepare("UPDATE kantong SET saldo = saldo + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nominal, kantongId);
          db.prepare(`
            INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_add', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, user_id, nominal, `[Kantong: ${kantong.nama}] ${catatan}`, user.nama);
        }
      } else if (destination.startsWith("grup_")) {
        const rawGrupId = destination.replace("grup_", "");
        let membership = db.prepare("SELECT id FROM keanggotaan WHERE user_id = ? AND grup_id = ?").get(user_id, rawGrupId) as any;
        if (!membership) {
          const memberId = crypto.randomUUID();
          db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(memberId, rawGrupId, user_id);
          membership = { id: memberId };
        }

        if (isDeduct) {
          const currentSaved = db.prepare(`
            SELECT COALESCE(SUM(t.jumlah), 0) as total
            FROM transaksi t
            WHERE t.keanggotaan_id = ? AND t.status = 'berhasil'
          `).get(membership.id) as any;
          const currentTotal = Number(currentSaved?.total || 0);

          if (currentTotal < nominal) {
            throw new Error(`Saldo Event tidak mencukupi (Tersedia: Rp ${currentTotal.toLocaleString("id-ID")})`);
          }
          db.prepare(`
            INSERT INTO transaksi (id, keanggotaan_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_deduct', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, membership.id, -nominal, catatan, user.nama);
        } else {
          db.prepare(`
            INSERT INTO transaksi (id, keanggotaan_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
            VALUES (?, ?, 'manual_add', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
          `).run(trxId, membership.id, nominal, catatan, user.nama);
        }
      } else {
        throw new Error("Tujuan saldo tidak valid");
      }
    });

    logAudit(
      user.id,
      isDeduct ? "MANUAL_DEDUCT_SALDO" : "MANUAL_ADD_SALDO",
      trxId,
      `${isDeduct ? "Kurangi" : "Tambah"} saldo Rp${nominal.toLocaleString("id-ID")} (${destination}): ${catatan}`
    );

    return NextResponse.json({
      success: true,
      id: trxId,
      message: `Berhasil ${isDeduct ? "mengurangi" : "menambahkan"} saldo Rp ${nominal.toLocaleString("id-ID")}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses transaksi saldo" }, { status: 400 });
  }
}
