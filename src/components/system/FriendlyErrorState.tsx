import { ShieldAlert } from 'lucide-react';

type FriendlyErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function FriendlyErrorState({
  title = 'Algo no salió como esperábamos.',
  message,
  retryLabel = 'Reintentar',
  onRetry,
}: FriendlyErrorStateProps) {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-content">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-content-secondary">{message}</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="focus-ring mt-8 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white">
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
