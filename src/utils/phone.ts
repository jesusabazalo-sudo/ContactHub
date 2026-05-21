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

  return phone.replace(/[()\-\s]+/g, ' ').trim();
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '+51 ••• ••• •••';
  if (phone.includes('•') || phone.includes('*')) return phone.replace(/\s+/g, ' ').trim();

  const digits = phone.replace(/\D/g, '');

  if (/^51\d{9}$/.test(digits) || /^\d{9}$/.test(digits)) {
    return '+51 9•• ••• •••';
  }

  return '+•• ••• •••';
}

export function phoneToWhatsapp(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (/^51\d{9}$/.test(digits)) return digits;
  if (/^\d{9}$/.test(digits)) return `51${digits}`;
  return digits;
}
