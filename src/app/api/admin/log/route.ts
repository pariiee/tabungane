import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = db.prepare(`
    SELECT l.*, u.nama as nama_admin, u.nim as nim_admin
    FROM audit_log l
    LEFT JOIN users u ON l.admin_id = u.id
    ORDER BY l.created_at DESC
    LIMIT 100
  `).all();

  return NextResponse.json({ data: logs });
}
