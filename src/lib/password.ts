export interface PasswordStrength {
  score: number; // 0-5
  label: string; // Lemah | Sedang | Kuat | Sangat Kuat
  color: string; // tailwind bg/text classes
  bar: string; // tailwind bg for progress
  percent: number; // 0-100
}

// Minimal yang dianggap aman: "Kuat" (score >= 4)
export const MIN_PASSWORD_SCORE = 4;

export function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "Lemah", color: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", percent: 10 };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1)
    return { score, label: "Lemah", color: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", percent: 20 };
  if (score <= 3)
    return { score, label: "Sedang", color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", percent: 55 };
  if (score === 4)
    return { score, label: "Kuat", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", percent: 80 };
  return { score, label: "Sangat Kuat", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", percent: 100 };
}

export function isPasswordStrongEnough(pw: string): boolean {
  return getPasswordStrength(pw).score >= MIN_PASSWORD_SCORE;
}
