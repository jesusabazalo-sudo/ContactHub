import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminGuard from './components/auth/AdminGuard';
import AuthGuard from './components/auth/AuthGuard';
import ChatWidget from './components/chat/ChatWidget';
import SplashScreen from './components/system/SplashScreen';
import WelcomeModal from './components/system/WelcomeModal';
import PageSkeleton from './components/ui/PageSkeleton';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';

const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'));
const DevolucionesPage = lazy(() => import('./pages/DevolucionesPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const MyContactsPage = lazy(() => import('./pages/MyContactsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const PublishServicePage = lazy(() => import('./pages/PublishServicePage'));
const ReclamacionesPage = lazy(() => import('./pages/ReclamacionesPage'));
const PromosPage = lazy(() => import('./pages/PromosPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const AdminAccessPage = lazy(() => import('./pages/admin/AdminAccessPage'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCategoriasPage = lazy(() => import('./pages/admin/AdminCategoriasPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminImportarPage = lazy(() => import('./pages/admin/AdminImportarPage'));
const AdminPaymentReceiptsPage = lazy(() => import('./pages/admin/AdminPaymentReceiptsPage'));
const AdminRecompensasPage = lazy(() => import('./pages/admin/AdminRecompensasPage'));
const AdminTokensPage = lazy(() => import('./pages/admin/AdminTokensPage'));
const AdminSoportePage = lazy(() => import('./pages/admin/AdminSoportePage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

export default function App() {
  return (
    <>
      <SplashScreen />
      <Suspense fallback={<PageSkeleton />}>
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
            <Route path="/privacidad" element={<PrivacyPage />} />
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
            <Route path="/admin/tokens" element={<AdminGuard><AdminTokensPage /></AdminGuard>} />
            <Route path="/admin/soporte" element={<AdminGuard><AdminSoportePage /></AdminGuard>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <WelcomeModal />
      <ChatWidget />
    </>
  );
}
