import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const amount = Math.floor(Number(body.nominal));
  const sumberId = body.sumber_id || (body.arah === "ke_dompet" ? body.kantong_id : "dompet_utama");
  const tujuanId = body.tujuan_id || (body.arah === "ke_kantong" ? body.kantong_id : "dompet_utama");
  const catatan = (body.catatan || "").trim();

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Nominal valid wajib diisi" }, { status: 400 });
  }

  if (sumberId === tujuanId) {
    return NextResponse.json({ error: "Sumber dan tujuan tidak boleh sama" }, { status: 400 });
  }

  // 1. Validasi saldo sumber
  let sumberNama = "Dompet Utama";
  if (sumberId === "dompet_utama") {
    const bal = getWalletBalance(user.id);
    if (bal < amount) {
      return NextResponse.json({ error: `Saldo Dompet Utama tidak mencukupi (Tersedia: Rp ${bal.toLocaleString("id-ID")})` }, { status: 400 });
    }
  } else {
    const sourcePocket = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(sumberId, user.id) as any;
    if (!sourcePocket) return NextResponse.json({ error: "Kantong sumber tidak ditemukan" }, { status: 404 });
    if (sourcePocket.saldo < amount) {
      return NextResponse.json({ error: `Saldo Kantong "${sourcePocket.nama}" tidak mencukupi (Tersedia: Rp ${sourcePocket.saldo.toLocaleString("id-ID")})` }, { status: 400 });
    }
    sumberNama = `Kantong "${sourcePocket.nama}"`;
  }

  // 2. Eksekusi perpindahan dalam 1 transaksi DB atomik
  return runTransaction(() => {
    // Kurangi sumber
    if (sumberId === "dompet_utama") {
      db.prepare(`
        INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
        VALUES (?, ?, 'alokasi_keluar', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), user.id, -amount, catatan ? `Pindah dana dari Dompet Utama: ${catatan}` : "Pindah dana dari Dompet Utama", user.nama);
    } else {
      db.prepare("UPDATE kantong SET saldo = saldo - ? WHERE id = ?").run(amount, sumberId);
    }

    // Tambah ke tujuan
    let tujuanNama = "Dompet Utama";
    if (tujuanId === "dompet_utama") {
      db.prepare(`
        INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
        VALUES (?, ?, 'alokasi_masuk', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), user.id, amount, catatan ? `Pindah dana ke Dompet Utama: ${catatan}` : `Tarik dari ${sumberNama} ke Dompet Utama`, user.nama);
    } else if (body.tipe_tujuan === "event" || body.is_event) {
      // Alokasi ke event tabungan bersama
      const group = db.prepare("SELECT * FROM grup_tabungan WHERE id = ?").get(tujuanId) as any;
      if (!group) throw new Error("Event tujuan tidak ditemukan");
      tujuanNama = `Event "${group.nama}"`;

      let membership = db.prepare("SELECT id FROM keanggotaan WHERE grup_id = ? AND user_id = ?").get(tujuanId, user.id) as any;
      if (!membership) {
        const newMId = crypto.randomUUID();
        db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(newMId, tujuanId, user.id);
        membership = { id: newMId };
      }

      db.prepare(`
        INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, paid_at, dibuat_oleh)
        VALUES (?, ?, ?, 'alokasi_masuk', ?, 'berhasil', ?, CURRENT_TIMESTAMP, ?)
      `).run(crypto.randomUUID(), user.id, membership.id, amount, catatan || `Iuran ${group.nama} dari ${sumberNama}`, user.nama);
    } else {
      // Ke kantong tujuan
      const targetPocket = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(tujuanId, user.id) as any;
      if (!targetPocket) throw new Error("Kantong tujuan tidak ditemukan");
      tujuanNama = `Kantong "${targetPocket.nama}"`;
      db.prepare("UPDATE kantong SET saldo = saldo + ? WHERE id = ?").run(amount, tujuanId);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memindahkan Rp ${amount.toLocaleString("id-ID")} dari ${sumberNama} ke ${tujuanNama}`,
    });
  });
}
