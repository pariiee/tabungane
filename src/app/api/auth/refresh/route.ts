import { NextResponse } from "next/server";
import { verifySession, signSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    let token = "";
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else {
      const body = await req.json().catch(() => ({}));
      token = body.token || "";
    }

    if (!token) {
      return NextResponse.json({ error: "Token tidak disertakan" }, { status: 400 });
    }

    const payload = verifySession(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid atau kedaluwarsa" }, { status: 401 });
    }

    const data = JSON.parse(payload);
    const lookupId = data.id || (data.nim ? (db.prepare("SELECT id FROM users WHERE nim = ? OR nomor_id = ?").get(data.nim, data.nim) as any)?.id : null);

    if (!lookupId) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const user = db.prepare(`
      SELECT id, nomor_id, nama, role, aktif, must_change_password, kelas_id, prodi_id, fakultas
      FROM users WHERE id = ?
    `).get(lookupId) as any;

    if (!user || !user.aktif) {
      return NextResponse.json({ error: "Akun nonaktif atau tidak ditemukan" }, { status: 403 });
    }

    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const newToken = signSession(JSON.stringify({
      id: user.id,
      nomor_id: user.nomor_id,
      nama: user.nama,
      role: user.role,
      exp,
    }));

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        nomor_id: user.nomor_id,
        nama: user.nama,
        role: user.role,
        kelas_id: user.kelas_id,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
