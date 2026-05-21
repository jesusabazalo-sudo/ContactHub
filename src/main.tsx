import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import ErrorBoundary from './components/system/ErrorBoundary';
import { AuthProvider } from './features/auth/AuthProvider';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
