import React from 'react';

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-content">
          <div className="text-5xl" aria-hidden="true">
            ⚠️
          </div>
          <h2 className="font-display text-2xl font-bold">Algo salió mal</h2>
          <p className="max-w-sm text-center text-sm leading-6 text-content-secondary">
            Ocurrió un error inesperado al mostrar esta pantalla. Puedes recargar la página o volver al inicio.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-contrast transition hover:bg-brand-hover"
            >
              Recargar página
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.assign('/');
              }}
              className="focus-ring rounded-full border border-border bg-surface px-5 py-3 text-sm font-bold text-content transition hover:border-brand/40"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
