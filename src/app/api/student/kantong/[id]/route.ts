import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import crypto from "node:crypto";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pocket = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(id, user.id) as any;
  if (!pocket) {
    return NextResponse.json({ error: "Kantong tidak ditemukan" }, { status: 404 });
  }

  runTransaction(() => {
    // Jika masih ada saldo di kantong, kembalikan dulu ke dompet utama
    if (pocket.saldo > 0) {
      const trxId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh, paid_at)
        VALUES (?, ?, 'alokasi_masuk', ?, 'berhasil', ?, ?, CURRENT_TIMESTAMP)
      `).run(trxId, user.id, pocket.saldo, `Pengembalian Saldo Kantong "${pocket.nama}" (Kantong Dihapus)`, user.nama);
    }

    db.prepare("DELETE FROM kantong WHERE id = ?").run(id);
  });

  return NextResponse.json({ success: true, message: `Kantong "${pocket.nama}" berhasil dihapus` });
}
