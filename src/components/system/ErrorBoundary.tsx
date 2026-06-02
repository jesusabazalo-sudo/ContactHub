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
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0F2027] p-6 text-white">
          <div className="text-5xl">!</div>
          <h2 className="text-xl font-bold">Algo salio mal</h2>
          <p className="text-center text-sm text-white/50">La pagina tuvo un problema. Puedes reintentar sin recargar toda la app.</p>
          <div className="flex gap-3">
            <button onClick={() => this.setState({ hasError: false })} className="rounded-lg bg-[#1DB47A] px-5 py-2 font-semibold text-white">
              Reintentar vista
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="rounded-lg border border-white/20 px-5 py-2 text-white"
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
