import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id, grup_id, jumlah, catatan } = await req.json();

  if (!user_id || !grup_id || !jumlah || !catatan) {
    return NextResponse.json({ error: "Mahasiswa, grup, nominal, dan catatan wajib diisi" }, { status: 400 });
  }

  const nominal = parseInt(jumlah, 10);
  if (isNaN(nominal) || nominal <= 0) {
    return NextResponse.json({ error: "Nominal harus angka lebih dari 0" }, { status: 400 });
  }

  const trxId = crypto.randomUUID();
  const { runTransaction } = require("@/lib/db");

  runTransaction(() => {
    // Ensure membership exists within transaction
    let membership = db.prepare("SELECT id FROM keanggotaan WHERE user_id = ? AND grup_id = ?").get(user_id, grup_id) as any;
    if (!membership) {
      const memberId = crypto.randomUUID();
      db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(memberId, grup_id, user_id);
      membership = { id: memberId };
    }

    db.prepare(`
      INSERT INTO transaksi (id, keanggotaan_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
      VALUES (?, ?, 'manual_add', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
    `).run(trxId, membership.id, nominal, catatan, user.nama);
  });

  logAudit(user.id, "MANUAL_ADD_SALDO", trxId, `Tambah saldo Rp${nominal.toLocaleString("id-ID")}: ${catatan}`);

  return NextResponse.json({ success: true, id: trxId });
}
