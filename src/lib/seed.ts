import { db } from "./db";
import { hashPassword } from "./auth";
import crypto from "node:crypto";

export function ensureSeedData() {
  const adminCheck = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'")
    .get() as any;
  if (adminCheck && adminCheck.count > 0) {
    return;
  }

  console.log("Seeding initial super admin account...");
  const adminId = crypto.randomUUID();
  const adminHash = hashPassword("admin123");
  db.prepare(
    "INSERT INTO users (id, nim, nama, role, password_hash, must_change_password, aktif) VALUES (?, ?, ?, ?, ?, ?, 1)"
  ).run(adminId, "admin", "Super Admin", "super_admin", adminHash, 0);

  console.log("Production seed ready: 1 super admin created.");
}

ensureSeedData();
