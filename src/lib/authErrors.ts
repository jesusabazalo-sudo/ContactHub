export function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('jwt') && lowerMessage.includes('expired')) {
    return 'Tu sesión expiró. Inicia sesión de nuevo.';
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Tu correo todavía no está confirmado.';
  }

  if (lowerMessage.includes('failed to fetch')) {
    return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  }

  if (lowerMessage.includes('permission denied')) {
    return 'No tienes acceso a esta sección.';
  }

  return message || 'No se pudo completar la acción. Intenta de nuevo.';
}

export function isExpiredSessionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes('jwt') && lowerMessage.includes('expired');
}
