import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import ScrollToTop from '../components/layout/ScrollToTop';
import TrustBar from '../components/layout/TrustBar';
import AmbientBackground from '../components/system/AmbientBackground';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function PublicLayout() {
  const location = useLocation();
  useScrollReveal(location.pathname);

  return (
    <div className="relative min-h-screen bg-canvas text-content">
      <AmbientBackground />
      <ScrollToTop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <TrustBar />
        <main key={location.pathname} className="route-enter flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
