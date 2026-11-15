import crypto from "node:crypto";

const AUTH_SECRET = process.env.AUTH_SECRET as string;
if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET env var is required and must not be empty");
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
