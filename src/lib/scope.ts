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
 * Returns array of allowed class IDs for this user,
 * or null if user is Super Admin (unrestricted campus access).
 */
export function getAllowedKelasIds(user: SessionUser): string[] | null {
  if (user.role === "super_admin") return null;

  // Jika Komting / Bendahara mengawasi kelas tertentu (1 atau beberapa kelas)
  if (user.managed_kelas_ids) {
    try {
      const parsed = JSON.parse(user.managed_kelas_ids);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      const parts = user.managed_kelas_ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
  }

  // Jika Komting / Bendahara terikat pada kelasnya
  if ((user.role === "komting" || user.role === "bendahara") && user.kelas_id) {
    return [user.kelas_id];
  }

  // Jika Admin Prodi
  if (user.prodi_id) {
    const rows = db.prepare("SELECT id FROM kelas WHERE prodi_id = ?").all(user.prodi_id) as any[];
    return rows.map((r) => r.id);
  }

  // Jika Dekan / Pengawas Fakultas
  if (user.fakultas) {
    const rows = db
      .prepare("SELECT k.id FROM kelas k JOIN prodi p ON k.prodi_id = p.id WHERE p.fakultas = ?")
      .all(user.fakultas) as any[];
    return rows.map((r) => r.id);
  }

  return [];
}

/**
 * Validates if the user (Super Admin, Dekan, Kaprodi, Komting, Bendahara) has authorization to access/modify a class.
 */
export function canAccessKelas(user: SessionUser, kelasId: string): boolean {
  if (user.role === "super_admin") return true;
  const allowed = getAllowedKelasIds(user);
  if (allowed === null) return true;
  return allowed.includes(kelasId);
}

/**
 * Validates if the user has authorization to access/modify a specific student.
 */
export function canAccessMahasiswa(user: SessionUser, userId: string): boolean {
  if (user.role === "super_admin") return true;
  const row = db.prepare("SELECT kelas_id FROM users WHERE id = ?").get(userId) as any;
  if (!row || !row.kelas_id) return false;
  return canAccessKelas(user, row.kelas_id);
}
