const attempts: Record<string, { count: number; lastAttempt: number }> = {};

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = attempts[key];

  if (!record || now - record.lastAttempt > windowMs) {
    attempts[key] = { count: 1, lastAttempt: now };
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count += 1;
  record.lastAttempt = now;
  return true;
}

export function getRateLimitMessage(windowMs = 60000): string {
  const seconds = Math.ceil(windowMs / 1000);
  return `Demasiados intentos. Espera ${seconds} segundos e intenta de nuevo.`;
}
