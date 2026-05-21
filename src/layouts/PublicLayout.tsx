import { Outlet } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import ScrollToTop from '../components/layout/ScrollToTop';
import CrackFireBackground from '../components/system/CrackFireBackground';

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-white">
      <CrackFireBackground />
      <ScrollToTop />
      <div className="relative z-10">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
