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

  const { tampilkan_saldo_leaderboard } = await req.json();
  const val = tampilkan_saldo_leaderboard ? 1 : 0;

  const { db } = require("@/lib/db");
  db.prepare("UPDATE users SET tampilkan_saldo_leaderboard = ? WHERE id = ?").run(val, user.id);

  return NextResponse.json({
    success: true,
    tampilkan_saldo_leaderboard: Boolean(val),
  });
}
