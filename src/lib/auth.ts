import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const AUTH_SECRET = process.env.AUTH_SECRET || "tabungane-sisfor-super-secure-key-2026";
const COOKIE_NAME = "tabungane_session";

export interface SessionUser {
  id: string;
  nim: string;
  nama: string;
  role: "super_admin" | "admin" | "mahasiswa";
  prodi_id?: string | null;
  fakultas?: string | null;
  must_change_password: boolean;
  kelas_id?: string | null;
  tampilkan_saldo_leaderboard?: boolean;
  foto_url?: string | null;
}

export function isAdminUser(user: SessionUser | null): user is SessionUser {
  return Boolean(user && (user.role === "admin" || user.role === "super_admin"));
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

export function signSession(payload: string): string {
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function verifySession(token: string): string | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const payload = Buffer.from(encoded, "base64url").toString("utf-8");
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  try {
    const data = JSON.parse(payload);
    if (!data.id || data.exp < Date.now()) return null;

    const row = db.prepare("SELECT id, nim, nama, role, must_change_password, aktif, kelas_id, prodi_id, fakultas, foto_url, COALESCE(tampilkan_saldo_leaderboard, 0) as tampilkan_saldo_leaderboard FROM users WHERE id = ?").get(data.id) as any;
    if (!row || !row.aktif) return null;

    // Normalisasi role: jika role admin tanpa prodi_id dan tanpa fakultas, jadikan super_admin
    const effectiveRole = (row.role === "admin" && !row.prodi_id && !row.fakultas) ? "super_admin" : row.role;

    return {
      id: row.id,
      nim: row.nim,
      nama: row.nama,
      role: effectiveRole,
      prodi_id: row.prodi_id || null,
      fakultas: row.fakultas || null,
      must_change_password: Boolean(row.must_change_password),
      kelas_id: row.kelas_id,
      tampilkan_saldo_leaderboard: Boolean(row.tampilkan_saldo_leaderboard),
      foto_url: row.foto_url || null,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const cookieStore = await cookies();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({
    id: user.id,
    nim: user.nim,
    nama: user.nama,
    role: user.role,
    exp,
  });
  const token = signSession(payload);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function logAudit(adminId: string, aksi: string, target: string, detail?: string) {
  try {
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO audit_log (id, admin_id, aksi, target, detail) VALUES (?, ?, ?, ?, ?)").run(
      id,
      adminId,
      aksi,
      target,
      detail || null
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
