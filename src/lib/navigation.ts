import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';

export function handleNavigation(navigate: NavigateFunction, path: string) {
  try {
    navigate(path);
  } catch {
    toast.error('No se pudo abrir esa sección. Intenta de nuevo.');
  }
}
