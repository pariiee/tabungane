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
 * Returns array of allowed prodi IDs for this user,
 * or null if user is Super Admin (full campus access).
 */
export function getAllowedProdiIds(user: SessionUser): string[] | null {
  if (user.role === "super_admin") return null;
  if (user.prodi_id) return [user.prodi_id];
  if (user.fakultas) {
    const rows = db.prepare("SELECT id FROM prodi WHERE fakultas = ?").all(user.fakultas) as any[];
    return rows.map((r) => r.id);
  }
  return [];
}

/**
 * Validates if the admin (Super Admin, Dekan Fakultas, or Kaprodi) has authorization to access/modify a specific class.
 */
export function canAccessKelas(user: SessionUser, kelasId: string): boolean {
  if (user.role === "super_admin") return true;

  const row = db
    .prepare("SELECT k.prodi_id, p.fakultas FROM kelas k LEFT JOIN prodi p ON k.prodi_id = p.id WHERE k.id = ?")
    .get(kelasId) as any;
  if (!row) return false;

  if (user.prodi_id && row.prodi_id === user.prodi_id) return true;
  if (user.fakultas && row.fakultas === user.fakultas) return true;
  return false;
}

/**
 * Validates if the admin has authorization to access/modify a specific student.
 */
export function canAccessMahasiswa(user: SessionUser, userId: string): boolean {
  if (user.role === "super_admin") return true;

  const row = db
    .prepare(
      `SELECT k.prodi_id, p.fakultas
       FROM users u
       LEFT JOIN kelas k ON u.kelas_id = k.id
       LEFT JOIN prodi p ON k.prodi_id = p.id
       WHERE u.id = ?`
    )
    .get(userId) as any;
  if (!row) return false;

  if (user.prodi_id && row.prodi_id === user.prodi_id) return true;
  if (user.fakultas && row.fakultas === user.fakultas) return true;
  return false;
}
