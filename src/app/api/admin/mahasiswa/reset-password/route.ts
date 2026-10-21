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

  const defaultId = targetUser.nomor_id || targetUser.nim;
  const passwordHash = hashPassword(defaultId);

  db.prepare("UPDATE users SET password_hash = ?, username = ?, must_change_password = 1 WHERE id = ?").run(
    passwordHash,
    defaultId,
    targetUser.id
  );

  logAudit(user.id, "RESET_PASSWORD", targetUser.id, `Reset password & username ke ID: ${defaultId}`);

  return NextResponse.json({
    success: true,
    temp_password: defaultId,
    username: defaultId,
    nomor_id: defaultId,
    nim: defaultId,
    nama: targetUser.nama,
    message: `Akun berhasil direset! Username dan Password login adalah ID: ${defaultId}`,
  });
}
