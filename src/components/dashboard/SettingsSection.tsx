import { LogOut, MessageCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';
import type { UnlockedAccess, UnlockedFolder } from '../../services/myContactsService';

type SettingsSectionProps = {
  email: string | null;
  folders: UnlockedFolder[];
  accessHistory: UnlockedAccess[];
  onSignOut: () => Promise<void>;
  onOpenSupportChat: (message: string) => void;
};

export default function SettingsSection({ email, folders, accessHistory, onSignOut, onOpenSupportChat }: SettingsSectionProps) {
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));

  async function handleConfirmSignOut() {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
      setIsConfirmingSignOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">Cuenta</p>
        <p className="mt-2 text-sm font-semibold text-content">{email ?? 'Sin correo'}</p>

        <div className="mt-5 border-t border-border pt-5">
          {isConfirmingSignOut ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-content">¿Seguro que quieres cerrar sesión?</p>
              <button
                type="button"
                onClick={() => void handleConfirmSignOut()}
                disabled={isSigningOut}
                className="focus-ring rounded-full bg-danger px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? 'Cerrando...' : 'Sí, salir'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingSignOut(false)}
                disabled={isSigningOut}
                className="focus-ring rounded-full border border-border bg-muted px-4 py-2 text-xs font-bold text-content"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingSignOut(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 text-sm font-bold text-content transition hover:border-danger/40 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">Soporte</p>
        <p className="mt-2 text-sm leading-6 text-content-secondary">¿Tienes dudas sobre tu cuenta o tus accesos? Escríbenos por chat.</p>
        <button
          type="button"
          onClick={() => onOpenSupportChat('Hola, tengo una consulta sobre mi cuenta en ContactHub.')}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand-text transition hover:bg-brand/20"
        >
          <MessageCircle className="h-4 w-4" />
          Abrir chat de soporte
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">Mis pagos</p>
        {accessHistory.length ? (
          <div className="mt-4 grid gap-3">
            {accessHistory.map((access) => (
              <div key={`${access.categoryId}-${access.createdAt ?? 'active'}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
                <span className="truncate font-semibold text-content">{foldersById.get(access.categoryId)?.name ?? 'Carpeta activa'}</span>
                <span className="shrink-0 text-xs text-content-muted">{access.createdAt ? formatDate(access.createdAt) : 'Sin fecha'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-content-secondary">Todavía no tienes pagos registrados.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
          <ShieldCheck className="h-3.5 w-3.5" />
          Legal
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/politica-privacidad" className="focus-ring rounded-full border border-border bg-muted px-4 py-2 text-xs font-bold text-content transition hover:border-brand/40">
            Ver políticas de privacidad
          </Link>
          <Link to="/terminos" className="focus-ring rounded-full border border-border bg-muted px-4 py-2 text-xs font-bold text-content transition hover:border-brand/40">
            Ver términos
          </Link>
        </div>
      </div>
    </div>
  );
}
