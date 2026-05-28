import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminGuard from './components/auth/AdminGuard';
import AuthGuard from './components/auth/AuthGuard';
import ChatWidget from './components/chat/ChatWidget';
import GeometryBackground from './components/system/GeometryBackground';
import LoadingState from './components/system/LoadingState';
import WelcomeModal from './components/system/WelcomeModal';
import { useAuth } from './features/auth/AuthProvider';
import PublicLayout from './layouts/PublicLayout';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthPage from './pages/AuthPage';
import CatalogPage from './pages/CatalogPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import ErrorPage from './pages/ErrorPage';
import FAQPage from './pages/FAQPage';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import MyContactsPage from './pages/MyContactsPage';
import PricingPage from './pages/PricingPage';
import PromosPage from './pages/PromosPage';
import ServicesPage from './pages/ServicesPage';
import AdminAccessPage from './pages/admin/AdminAccessPage';
import AdminContactsPage from './pages/admin/AdminContactsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCategoriasPage from './pages/admin/AdminCategoriasPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminImportarPage from './pages/admin/AdminImportarPage';
import AdminPaymentReceiptsPage from './pages/admin/AdminPaymentReceiptsPage';
import AdminRecompensasPage from './pages/admin/AdminRecompensasPage';
import AdminSoportePage from './pages/admin/AdminSoportePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState />;
  if (!user && location.pathname !== '/auth' && location.pathname !== '/auth/callback') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <GeometryBackground />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAuth><PublicLayout /></RequireAuth>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:slug" element={<CategoryDetailPage />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/promos" element={<PromosPage />} />
          <Route path="/mis-contactos" element={<AuthGuard><MyContactsPage /></AuthGuard>} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
          <Route path="/admin/usuarios" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
          <Route path="/admin/accesos" element={<AdminGuard><AdminAccessPage /></AdminGuard>} />
          <Route path="/admin/clientes" element={<AdminGuard><AdminCustomersPage /></AdminGuard>} />
          <Route path="/admin/contactos" element={<AdminGuard><AdminContactsPage /></AdminGuard>} />
          <Route path="/admin/categorias" element={<AdminGuard><AdminCategoriasPage /></AdminGuard>} />
          <Route path="/admin/importar" element={<AdminGuard><AdminImportarPage /></AdminGuard>} />
          <Route path="/admin/comprobantes" element={<AdminGuard><AdminPaymentReceiptsPage /></AdminGuard>} />
          <Route path="/admin/recompensas" element={<AdminGuard><AdminRecompensasPage /></AdminGuard>} />
          <Route path="/admin/soporte" element={<AdminGuard><AdminSoportePage /></AdminGuard>} />
        </Route>
        <Route path="*" element={<RequireAuth><Navigate to="/error" replace /></RequireAuth>} />
      </Routes>
      <WelcomeModal />
      <ChatWidget />
    </>
  );
}
