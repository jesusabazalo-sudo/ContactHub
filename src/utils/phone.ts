export function formatPhone(phone?: string | null): string {
  if (!phone) return '';

  const normalized = phone.replace(/[()\-\s]+/g, '').trim();
  const digits = normalized.replace(/\D/g, '');

  if (/^51\d{9}$/.test(digits)) {
    const local = digits.slice(2);
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }

  if (/^\d{9}$/.test(digits)) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  if (/^1\d{10}$/.test(digits)) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return phone.replace(/[()\-\s]+/g, ' ').trim();
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '+51 ••• ••• •••';
  if (phone.includes('•') || phone.includes('*')) return phone.replace(/\*/g, '•').replace(/\s+/g, ' ').trim();

  const digits = phone.replace(/\D/g, '');

  if (/^51\d{9}$/.test(digits) || /^\d{9}$/.test(digits)) {
    const local = /^51\d{9}$/.test(digits) ? digits.slice(2) : digits;
    const visibleDigit = local[0] || '9';
    return `+51 ${visibleDigit}••• ••• •••`;
  }

  if (/^1\d{10}$/.test(digits)) {
    return '+1 •••• ••••';
  }

  const prefix = phone.trim().match(/^\+\d{1,3}/)?.[0];
  if (prefix) return `${prefix} ••• •••`;

  return '+•• ••• •••';
}

export function getPhoneDisplay(phone: string | null | undefined, level: 0 | 1 | 2): string {
  if (level === 2) return formatPhone(phone);
  if (!phone) return level === 0 ? '+51 9•• ••• •••' : '+51 ••• ••• •••';
  if (phone.includes('•') || phone.includes('*')) return maskPhone(phone);

  const digits = phone.replace(/\D/g, '');

  if (/^51\d{9}$/.test(digits) || /^\d{9}$/.test(digits)) {
    const local = /^51\d{9}$/.test(digits) ? digits.slice(2) : digits;
    if (level === 0) return `+51 ${local[0] || '9'}•• ••• •••`;
    return `+51 ${local.slice(0, 3)} ••• •••`;
  }

  if (/^1\d{10}$/.test(digits)) {
    return level === 0 ? '+1 •••• ••••' : `+1 ${digits.slice(1, 4)} ••••`;
  }

  const prefix = phone.trim().match(/^\+\d{1,3}/)?.[0] ?? '+••';
  return level === 0 ? `${prefix} ••• •••` : `${prefix} ${digits.slice(0, 3) || '•••'} •••`;
}

export function phoneToWhatsapp(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (/^51\d{9}$/.test(digits)) return digits;
  if (/^\d{9}$/.test(digits)) return `51${digits}`;
  return digits;
}
