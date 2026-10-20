import { SessionUser } from "./auth";
import { db } from "./db";

/**
 * Returns prodi_id scope if user is a restricted Admin Prodi,
 * or null if user is Super Admin (unrestricted campus-wide access).
 */
export function getProdiScope(user: SessionUser): string | null {
  if (user.role === "super_admin") return null;
  if (user.role === "admin" && user.prodi_id) return user.prodi_id;
  return null;
}

/**
 * Validates if the admin has authorization to access/modify a specific class.
 */
export function canAccessKelas(user: SessionUser, kelasId: string): boolean {
  if (user.role === "super_admin") return true;
  if (!user.prodi_id) return false;

  const row = db.prepare("SELECT prodi_id FROM kelas WHERE id = ?").get(kelasId) as any;
  return Boolean(row && row.prodi_id === user.prodi_id);
}

/**
 * Validates if the admin has authorization to access/modify a specific student.
 */
export function canAccessMahasiswa(user: SessionUser, userId: string): boolean {
  if (user.role === "super_admin") return true;
  if (!user.prodi_id) return false;

  const row = db
    .prepare(
      `SELECT k.prodi_id
       FROM users u
       LEFT JOIN kelas k ON u.kelas_id = k.id
       WHERE u.id = ?`
    )
    .get(userId) as any;

  return Boolean(row && row.prodi_id === user.prodi_id);
}
