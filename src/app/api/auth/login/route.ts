import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, SessionUser } from "@/lib/auth";
import "@/lib/seed"; // ensure seeded

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.id || body.nim;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: "ID dan password wajib diisi" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "127.0.0.1";
    const cleanId = String(identifier).trim().toLowerCase();
    const rateLimitKey = `${cleanId}:${ip}`;

    const now = Date.now();
    const attemptRow = db
      .prepare("SELECT attempts, first_attempt, locked_until FROM login_attempts WHERE key = ?")
      .get(rateLimitKey) as any;

    if (attemptRow && attemptRow.locked_until > now) {
      // Locked for 5 minutes: keep error message generic
      return NextResponse.json({ error: "ID atau password salah" }, { status: 401 });
    }

    // Helper to record failed attempt
    const recordFailedAttempt = () => {
      let attempts = 1;
      let firstAttempt = now;

      if (attemptRow && now - attemptRow.first_attempt <= 60000) {
        attempts = attemptRow.attempts + 1;
        firstAttempt = attemptRow.first_attempt;
      }

      const lockedUntil = attempts >= 5 ? now + 5 * 60 * 1000 : 0;

      db.prepare(`
        INSERT INTO login_attempts (key, attempts, first_attempt, locked_until)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          attempts = excluded.attempts,
          first_attempt = excluded.first_attempt,
          locked_until = excluded.locked_until
      `).run(rateLimitKey, attempts, firstAttempt, lockedUntil);
    };

    // Cari user berdasarkan ID (nim) atau username
    const user = db.prepare("SELECT * FROM users WHERE (LOWER(nim) = LOWER(?) OR (username IS NOT NULL AND LOWER(username) = LOWER(?))) AND aktif = 1").get(cleanId, cleanId) as any;
    if (!user) {
      recordFailedAttempt();
      return NextResponse.json({ error: "ID atau password salah" }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailedAttempt();
      return NextResponse.json({ error: "ID atau password salah" }, { status: 401 });
    }

    // Login success -> reset rate limit attempts
    db.prepare("DELETE FROM login_attempts WHERE key = ?").run(rateLimitKey);

    const sessionUser: SessionUser = {
      id: user.id,
      nomor_id: user.nomor_id,
      nama: user.nama,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
      kelas_id: user.kelas_id,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
