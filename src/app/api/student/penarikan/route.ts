import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = db.prepare(`
    SELECT id, jumlah, metode, nomor_tujuan, nama_penerima, catatan, status, bukti_transfer_url, catatan_admin, created_at, updated_at
    FROM pengajuan_penarikan
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user.id);

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.must_change_password) return NextResponse.json({ error: "Wajib ganti password dulu sebelum melakukan aksi" }, { status: 403 });

  const body = await req.json();
  const nominal = Math.floor(Number(body.jumlah));
  const metode = (body.metode || "").trim();
  const nomor_tujuan = (body.nomor_tujuan || "").trim();
  const nama_penerima = (body.nama_penerima || "").trim();
  const catatan = (body.catatan || "").trim();

  if (!nominal || nominal < 10000) {
    return NextResponse.json({ error: "Minimal penarikan saldo adalah Rp 10.000" }, { status: 400 });
  }

  if (!metode || !nomor_tujuan || !nama_penerima) {
    return NextResponse.json({ error: "Metode, nomor rekening/e-wallet, dan nama penerima wajib diisi" }, { status: 400 });
  }

  // Cek saldo dompet utama
  const balance = getWalletBalance(user.id);
  if (balance < nominal) {
    return NextResponse.json({ error: `Saldo dompet tidak mencukupi (Tersedia: Rp ${balance.toLocaleString("id-ID")})` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const trxId = crypto.randomUUID();

  runTransaction(() => {
    // 1. Hold saldo via transaksi pending debit (jumlah negatif untuk pengeluaran)
    db.prepare(`
      INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh)
      VALUES (?, ?, 'debit', ?, 'pending', ?, ?)
    `).run(trxId, user.id, -nominal, `Pengajuan Tarik Saldo via ${metode.toUpperCase()} (${nomor_tujuan})`, user.nama);

    // 2. Simpan record pengajuan penarikan
    db.prepare(`
      INSERT INTO pengajuan_penarikan (
        id, user_id, jumlah, metode, nomor_tujuan, nama_penerima, catatan, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, user.id, nominal, metode, nomor_tujuan, nama_penerima, catatan);
  });

  return NextResponse.json({
    success: true,
    message: "Pengajuan penarikan saldo berhasil dibuat dan menunggu konfirmasi admin",
  });
}
