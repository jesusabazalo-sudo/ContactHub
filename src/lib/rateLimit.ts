const STORAGE_PREFIX = 'contacthub:rate-limit:';

type RateLimitRecord = { count: number; windowStart: number };

function readRecord(key: string): RateLimitRecord | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as RateLimitRecord;
  } catch {
    return null;
  }
}

function writeRecord(key: string, record: RateLimitRecord) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(record));
  } catch {
    // localStorage no disponible (modo privado, cuota llena): degrada a "siempre permitido".
  }
}

/** Rate limit client-side persistido en localStorage: sobrevive a un refresh de página. */
export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = readRecord(key);

  if (!record || now - record.windowStart > windowMs) {
    writeRecord(key, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  writeRecord(key, { count: record.count + 1, windowStart: record.windowStart });
  return true;
}

export function getRateLimitMessage(windowMs = 60000): string {
  const seconds = Math.ceil(windowMs / 1000);
  return `Demasiados intentos. Espera ${seconds} segundos e intenta de nuevo.`;
}
