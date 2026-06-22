import type { PropsWithChildren } from 'react';
import AmbientBackground from '../components/system/AmbientBackground';

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen bg-canvas text-content">
      <AmbientBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
