import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, isAdminUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id } = await req.json();
  const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user_id) as any;
  if (!targetUser) {
    return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  const tempPassword = `reset${Math.floor(100000 + Math.random() * 900000)}`;
  const passwordHash = hashPassword(tempPassword);

  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(
    passwordHash,
    targetUser.id
  );

  logAudit(user.id, "RESET_PASSWORD", targetUser.id, `Reset password untuk NIM: ${targetUser.nim}`);

  return NextResponse.json({
    success: true,
    temp_password: tempPassword,
    nim: targetUser.nim,
    nama: targetUser.nama,
  });
}
