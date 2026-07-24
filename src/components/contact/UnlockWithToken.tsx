import { CheckCircle2, Loader2, Unlock } from 'lucide-react';
import { useState } from 'react';
import { onOverlayClick, useModalDismiss } from '../../hooks/useModalDismiss';
import { useTokens } from '../../hooks/useTokens';
import { notify } from '../../lib/toast';

type UnlockWithTokenProps = {
  contactId: string;
  contactName: string;
  onUnlocked: () => void;
};

const EARN_METHODS = [
  { icon: '✅', label: '3 tokens al registrarte', detail: 'Automático, apenas creas tu cuenta.' },
  { icon: '📲', label: '2 tokens por seguir ContactHub en redes', detail: 'Envía la captura de evidencia por chat.' },
  { icon: '👥', label: '3 tokens por recomendar a un amigo', detail: 'Se acreditan cuando tu amigo se registra.' },
  { icon: '⭐', label: '1 token por dejar una reseña verificada', detail: 'Cuéntanos tu experiencia con ContactHub.' },
];

export default function UnlockWithToken({ contactId, contactName, onUnlocked }: UnlockWithTokenProps) {
  const { balance, isLoading: isTokensLoading, isContactUnlocked, spendToken } = useTokens();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useModalDismiss(isInfoOpen, () => setIsInfoOpen(false));

  const alreadyUnlocked = isContactUnlocked(contactId);

  async function handleUnlock() {
    if (isUnlocking) return;
    setIsUnlocking(true);
    try {
      const result = await spendToken(contactId);
      if (result.status === 'success') {
        notify.success(`¡Desbloqueaste a ${result.contactName || contactName}!`);
        setJustUnlocked(true);
        onUnlocked();
      } else if (result.status === 'already_unlocked') {
        notify.info('Ya tenías acceso a este contacto.');
        onUnlocked();
      } else if (result.status === 'insufficient_tokens') {
        setIsInfoOpen(true);
      } else {
        notify.error(result.message);
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  if (alreadyUnlocked || justUnlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-text">
        <CheckCircle2 className="h-3 w-3" />
        {justUnlocked ? 'Desbloqueado con token' : 'Desbloqueado'}
      </span>
    );
  }

  if (isUnlocking) {
    return (
      <button type="button" disabled className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-content-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Desbloqueando...
      </button>
    );
  }

  if (!isTokensLoading && balance < 1) {
    return (
      <>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-content-muted">Sin tokens disponibles</span>
          <button type="button" onClick={() => setIsInfoOpen(true)} className="focus-ring w-fit text-xs font-semibold text-brand-text hover:text-content">
            ¿Cómo conseguir tokens? →
          </button>
        </div>
        {isInfoOpen ? <HowToEarnTokensModal onClose={() => setIsInfoOpen(false)} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => void handleUnlock()}
          disabled={isTokensLoading}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand/[0.08] px-3 py-2 text-xs font-semibold text-brand-text transition hover:border-brand/45 hover:bg-brand/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Unlock className="h-3.5 w-3.5" />
          Desbloquear con 1 token
        </button>
        <span className="text-[11px] text-content-muted">Tienes {balance} token{balance === 1 ? '' : 's'} disponible{balance === 1 ? '' : 's'}</span>
      </div>
      {isInfoOpen ? <HowToEarnTokensModal onClose={() => setIsInfoOpen(false)} /> : null}
    </>
  );
}

export function HowToEarnTokensModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onOverlayClick(onClose)}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
        <h3 className="font-display text-xl font-bold text-content">¿Cómo conseguir tokens?</h3>
        <p className="mt-2 text-sm text-content-secondary">Usa tokens para desbloquear contactos individuales sin comprar la carpeta completa.</p>
        <div className="mt-5 grid gap-3">
          {EARN_METHODS.map((method) => (
            <div key={method.label} className="flex items-start gap-3 rounded-xl border border-border bg-muted p-3">
              <span className="text-lg" aria-hidden="true">{method.icon}</span>
              <div>
                <p className="text-sm font-semibold text-content">{method.label}</p>
                <p className="mt-0.5 text-xs text-content-muted">{method.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="focus-ring mt-6 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-contrast transition hover:bg-brand-hover">
          Entendido
        </button>
      </div>
    </div>
  );
}
