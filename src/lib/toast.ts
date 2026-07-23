import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { createElement } from 'react';
import { toast } from 'sonner';

type ToastKind = 'success' | 'error' | 'info';

const DURATIONS: Record<ToastKind, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
};

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastKind, string> = {
  success: 'border-brand/30 text-brand-text',
  error: 'border-danger/30 text-danger',
  info: 'border-border text-content-secondary',
};

/** Toast custom con icono, barra de progreso animada y cierre manual (D2). */
function show(kind: ToastKind, message: string) {
  const duration = DURATIONS[kind];
  const Icon = ICONS[kind];

  toast.custom(
    (id) =>
      createElement(
        'div',
        {
          className: `animate-toast-slide-up ripple-container relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-elevated p-4 pr-9 shadow-lg ${TONE_CLASSES[kind]}`,
        },
        createElement(Icon, { className: 'mt-0.5 h-5 w-5 flex-none' }),
        createElement('p', { className: 'flex-1 text-sm font-medium leading-5 text-content' }, message),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.dismiss(id),
            'aria-label': 'Cerrar notificación',
            className: 'absolute right-2 top-2 rounded-full p-1 text-content-muted transition hover:text-content',
          },
          '✕',
        ),
        createElement('span', {
          className: 'toast-progress-bar absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-40',
          style: { animationDuration: `${duration}ms` },
        }),
      ),
    { duration },
  );
}

export const notify = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
};
