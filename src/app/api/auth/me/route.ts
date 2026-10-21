import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { db } = require("@/lib/db");

  // 1. Update Nama Lengkap (Hanya role atas / staf, mahasiswa terkunci)
  if (body.nama !== undefined) {
    if (user.role === "mahasiswa") {
      return NextResponse.json(
        { error: "Nama lengkap mahasiswa dikunci dan hanya dapat diubah oleh Dekan/Kaprodi/Admin" },
        { status: 403 }
      );
    }
    const rawNama = (body.nama || "").trim();
    if (!rawNama || rawNama.length < 2) {
      return NextResponse.json({ error: "Nama lengkap minimal 2 karakter" }, { status: 400 });
    }
    db.prepare("UPDATE users SET nama = ? WHERE id = ?").run(rawNama, user.id);
  }

  // 2. Update Username
  if (body.username !== undefined) {
    const rawUsername = (body.username || "").trim().toLowerCase();
    if (rawUsername) {
      if (!/^[a-z0-9_]{3,20}$/.test(rawUsername)) {
        return NextResponse.json(
          { error: "Username hanya boleh huruf kecil, angka, dan underscore (3-20 karakter)" },
          { status: 400 }
        );
      }
      const existing = db
        .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .get(rawUsername, user.id);
      if (existing) {
        return NextResponse.json({ error: "Username sudah digunakan oleh pengguna lain" }, { status: 400 });
      }
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(rawUsername, user.id);
    } else {
      db.prepare("UPDATE users SET username = NULL WHERE id = ?").run(user.id);
    }
  }

  // 2. Update Privasi Saldo Leaderboard
  if (body.tampilkan_saldo_leaderboard !== undefined) {
    const val = body.tampilkan_saldo_leaderboard ? 1 : 0;
    db.prepare("UPDATE users SET tampilkan_saldo_leaderboard = ? WHERE id = ?").run(val, user.id);
  }

  const updatedUser = await getCurrentUser();
  return NextResponse.json({
    success: true,
    user: updatedUser,
  });
}
