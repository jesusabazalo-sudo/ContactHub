const AVATAR_HUES = [152, 200, 262, 24, 330, 48, 190, 280];

/** Hash simple y estable para derivar un color consistente desde un string (email). */
function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(seed: string) {
  const hue = AVATAR_HUES[hashString(seed) % AVATAR_HUES.length];
  return `hsl(${hue} 62% 45%)`;
}

export function getInitials(email: string | null | undefined, name?: string | null) {
  const source = (name || email || '').trim();
  if (!source) return '?';

  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }

  const localPart = source.split('@')[0] ?? source;
  return localPart.slice(0, 2).toUpperCase();
}
