import { Outlet } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import ScrollToTop from '../components/layout/ScrollToTop';
import AmbientBackground from '../components/system/AmbientBackground';

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-canvas text-content">
      <AmbientBackground />
      <ScrollToTop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
