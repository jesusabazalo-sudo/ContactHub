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
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-content">
          <div className="text-5xl">!</div>
          <h2 className="text-xl font-bold">Algo salio mal</h2>
          <p className="text-center text-sm text-content/50">La pagina tuvo un problema. Puedes reintentar sin recargar toda la app.</p>
          <div className="flex gap-3">
            <button onClick={() => this.setState({ hasError: false })} className="rounded-lg bg-brand px-5 py-2 font-semibold text-content">
              Reintentar vista
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="rounded-lg border border-border px-5 py-2 text-content"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
