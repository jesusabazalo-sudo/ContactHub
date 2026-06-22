type LoadingStateProps = {
  title?: string;
  message?: string;
};

export default function LoadingState({ title = 'Cargando...', message = 'Estamos preparando esta sección.' }: LoadingStateProps) {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          <h1 className="mt-6 font-display text-2xl font-bold text-content">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-content-secondary">{message}</p>
        </div>
      </div>
    </section>
  );
}
