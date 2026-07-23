export function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(value);
}

/** "hace 2 horas", "ayer", "hace 3 días", con fallback a fecha corta más allá de 7 días. */
export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return 'Fecha desconocida';

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return 'hace instantes';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? '' : 's'}`;
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;

  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(date);
}

/** "Miembro desde julio 2025". */
export function formatMemberSince(value: string | null | undefined) {
  if (!value) return 'Miembro nuevo';
  return `Miembro desde ${new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(value))}`;
}
