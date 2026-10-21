import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kantong_id, nominal, arah } = await req.json();
  const amount = Math.floor(Number(nominal));

  if (!kantong_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "Kantong dan nominal valid wajib diisi" }, { status: 400 });
  }

  const pocket = db.prepare("SELECT * FROM kantong WHERE id = ? AND user_id = ?").get(kantong_id, user.id) as any;
  if (!pocket) {
    return NextResponse.json({ error: "Kantong tidak ditemukan" }, { status: 404 });
  }

  if (arah === "ke_kantong") {
    // Cek saldo dompet utama
    const walletBalance = getWalletBalance(user.id);
    if (walletBalance < amount) {
      return NextResponse.json({ error: "Saldo Dompet Utama tidak mencukupi" }, { status: 400 });
    }

    runTransaction(() => {
      // 1. Kurangi dompet utama via ledger
      const trxId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh)
        VALUES (?, ?, 'debit', ?, 'sukses', ?, ?)
      `).run(trxId, user.id, amount, `Alokasi ke Kantong "${pocket.nama}"`, user.nama);

      // 2. Tambah saldo kantong
      db.prepare("UPDATE kantong SET saldo = saldo + ? WHERE id = ?").run(amount, kantong_id);
    });

    return NextResponse.json({ success: true, message: `Berhasil memindahkan Rp ${amount.toLocaleString("id-ID")} ke kantong "${pocket.nama}"` });
  } else if (arah === "ke_dompet") {
    // Cek saldo kantong
    if (pocket.saldo < amount) {
      return NextResponse.json({ error: "Saldo Kantong tidak mencukupi" }, { status: 400 });
    }

    runTransaction(() => {
      // 1. Kurangi saldo kantong
      db.prepare("UPDATE kantong SET saldo = saldo - ? WHERE id = ?").run(amount, kantong_id);

      // 2. Tambah saldo dompet utama via ledger
      const trxId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transaksi (id, user_id, tipe, jumlah, status, catatan, dibuat_oleh)
        VALUES (?, ?, 'kredit', ?, 'sukses', ?, ?)
      `).run(trxId, user.id, amount, `Tarik dari Kantong "${pocket.nama}" ke Dompet Utama`, user.nama);
    });

    return NextResponse.json({ success: true, message: `Berhasil mengembalikan Rp ${amount.toLocaleString("id-ID")} ke Dompet Utama` });
  } else {
    return NextResponse.json({ error: "Arah transfer tidak valid" }, { status: 400 });
  }
}
