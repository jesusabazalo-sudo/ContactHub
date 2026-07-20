import { Navigate, Route, Routes } from 'react-router-dom';
import AdminGuard from './components/auth/AdminGuard';
import AuthGuard from './components/auth/AuthGuard';
import ChatWidget from './components/chat/ChatWidget';
import WelcomeModal from './components/system/WelcomeModal';
import PublicLayout from './layouts/PublicLayout';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthPage from './pages/AuthPage';
import CatalogPage from './pages/CatalogPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import DevolucionesPage from './pages/DevolucionesPage';
import ErrorPage from './pages/ErrorPage';
import FAQPage from './pages/FAQPage';
import GuidePage from './pages/GuidePage';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import MyContactsPage from './pages/MyContactsPage';
import PricingPage from './pages/PricingPage';
import PrivacyPage from './pages/PrivacyPage';
import PublishServicePage from './pages/PublishServicePage';
import ReclamacionesPage from './pages/ReclamacionesPage';
import PromosPage from './pages/PromosPage';
import ServicesPage from './pages/ServicesPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:slug" element={<CategoryDetailPage />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/promos" element={<PromosPage />} />
          <Route path="/publica-tu-servicio" element={<PublishServicePage />} />
          <Route path="/mis-contactos" element={<AuthGuard><MyContactsPage /></AuthGuard>} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/guia" element={<GuidePage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/politica-privacidad" element={<PrivacyPage />} />
          <Route path="/privacidad" element={<Navigate to="/politica-privacidad" replace />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/devoluciones" element={<DevolucionesPage />} />
          <Route path="/reclamaciones" element={<ReclamacionesPage />} />
          <Route path="/soporte" element={<SupportPage />} />
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
        <Route path="*" element={<Navigate to="/error" replace />} />
      </Routes>
      <WelcomeModal />
      <ChatWidget />
    </>
  );
}
