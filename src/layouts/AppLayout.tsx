import type { PropsWithChildren } from 'react';
import CrackFireBackground from '../components/system/CrackFireBackground';

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen bg-ink-950 text-white">
      <CrackFireBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
