import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const bulan = url.searchParams.get("bulan"); // format: YYYY-MM

  let query = `
    SELECT id, tipe, nominal, kategori, catatan, tanggal, created_at
    FROM catatan_harian
    WHERE user_id = ?
  `;
  const params: any[] = [user.id];

  if (bulan) {
    query += " AND strftime('%Y-%m', tanggal) = ?";
    params.push(bulan);
  }

  query += " ORDER BY tanggal DESC, created_at DESC";

  const list = db.prepare(query).all(...params) as any[];

  // Calculate totals
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const item of list) {
    if (item.tipe === "masuk") {
      totalMasuk += item.nominal;
    } else {
      totalKeluar += item.nominal;
    }
  }

  const sisa = totalMasuk - totalKeluar;

  // Cek target bulanan jika ada filter bulan
  let targetTabungan = 0;
  if (bulan) {
    const targetRow = db.prepare("SELECT target_tabungan FROM catatan_target WHERE user_id = ? AND bulan = ?").get(user.id, bulan) as any;
    targetTabungan = targetRow?.target_tabungan || 0;
  }

  return NextResponse.json({
    data: list,
    summary: {
      total_masuk: totalMasuk,
      total_keluar: totalKeluar,
      sisa_saldo: sisa,
      target_tabungan: targetTabungan,
      count: list.length,
    },
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const bulan = (body.bulan || new Date().toISOString().slice(0, 7)).trim();
    const target = Math.max(0, parseInt(body.target_tabungan, 10) || 0);

    db.prepare(`
      INSERT INTO catatan_target (user_id, bulan, target_tabungan)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, bulan) DO UPDATE SET target_tabungan = excluded.target_tabungan
    `).run(user.id, bulan, target);

    return NextResponse.json({ success: true, bulan, target_tabungan: target });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui target" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const tipe = body.tipe === "masuk" ? "masuk" : "keluar";
    const nominal = Math.abs(parseInt(body.nominal, 10));
    const kategori = (body.kategori || (tipe === "masuk" ? "Uang Saku" : "Lainnya")).trim();
    const catatan = (body.catatan || "").trim();
    const tanggal = body.tanggal || new Date().toISOString().slice(0, 10);

    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }

    const id = "ch_" + crypto.randomBytes(6).toString("hex");

    db.prepare(`
      INSERT INTO catatan_harian (id, user_id, tipe, nominal, kategori, catatan, tanggal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, tipe, nominal, kategori, catatan, tanggal);

    const created = db.prepare("SELECT * FROM catatan_harian WHERE id = ?").get(id);

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan catatan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID catatan wajib disertakan" }, { status: 400 });
    }

    const res = db.prepare("DELETE FROM catatan_harian WHERE id = ? AND user_id = ?").run(id, user.id);

    if (res.changes === 0) {
      return NextResponse.json({ error: "Catatan tidak ditemukan atau sudah dihapus" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus catatan" }, { status: 500 });
  }
}
