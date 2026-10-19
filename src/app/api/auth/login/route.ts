import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import "@/lib/seed"; // ensure seeded

export async function POST(req: Request) {
  try {
    const { nim, password } = await req.json();

    if (!nim || !password) {
      return NextResponse.json({ error: "NIM dan password wajib diisi" }, { status: 400 });
    }

    const user = db.prepare("SELECT * FROM users WHERE nim = ? AND aktif = 1").get(nim) as any;
    if (!user) {
      return NextResponse.json({ error: "NIM atau password salah" }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "NIM atau password salah" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      nim: user.nim,
      nama: user.nama,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
      kelas_id: user.kelas_id,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
