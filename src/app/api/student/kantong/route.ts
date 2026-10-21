import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pockets = db.prepare(`
    SELECT id, nama, target_nominal, saldo, warna, created_at
    FROM kantong
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(user.id);

  return NextResponse.json({ data: pockets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const nama = (body.nama || "").trim();
  const target = Math.max(0, parseInt(body.target_nominal) || 0);
  const warna = body.warna || "zinc";

  if (!nama) {
    return NextResponse.json({ error: "Nama kantong wajib diisi" }, { status: 400 });
  }

  // Maksimal 2 kantong tambahan (total 3 termasuk Kantong Utama)
  const currentCount = (db.prepare("SELECT COUNT(*) as cnt FROM kantong WHERE user_id = ?").get(user.id) as any)?.cnt || 0;
  if (currentCount >= 2) {
    return NextResponse.json({ error: "Batas maksimal 3 kantong (termasuk Kantong Utama) telah tercapai" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO kantong (id, user_id, nama, target_nominal, saldo, warna)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, user.id, nama, target, warna);

  const pocket = db.prepare("SELECT * FROM kantong WHERE id = ?").get(id);
  return NextResponse.json({ success: true, data: pocket });
}
