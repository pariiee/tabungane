import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, createSession, SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
  }

  const newHash = hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(newHash, user.id);

  // Sekarang set session setelah password berhasil diubah
  const sessionUser: SessionUser = {
    id: user.id,
    nomor_id: user.nomor_id,
    nama: user.nama,
    role: user.role,
    must_change_password: false,
    kelas_id: user.kelas_id,
  };
  await createSession(sessionUser);

  return NextResponse.json({ success: true, message: "Password berhasil diperbarui" });
}
