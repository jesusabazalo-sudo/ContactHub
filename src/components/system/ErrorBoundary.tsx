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
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold">Algo salió mal</h2>
          <p className="text-center text-sm text-white/50">La página tuvo un problema. Recargar suele solucionarlo.</p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-[#1DB47A] px-5 py-2 font-semibold text-white">
              Recargar página
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
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
