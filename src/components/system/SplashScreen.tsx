import { useEffect, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';

const MAX_VISIBLE_MS = 300;
const FADE_OUT_MS = 200;

/** Splash de arranque mientras se verifica la sesión. Nunca visible más de 300ms. */
export default function SplashScreen() {
  const { isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const hardLimit = window.setTimeout(() => setIsFading(true), MAX_VISIBLE_MS);
    return () => window.clearTimeout(hardLimit);
  }, []);

  useEffect(() => {
    if (!isLoading) setIsFading(true);
  }, [isLoading]);

  useEffect(() => {
    if (!isFading) return undefined;
    const removeTimer = window.setTimeout(() => setIsMounted(false), FADE_OUT_MS);
    return () => window.clearTimeout(removeTimer);
  }, [isFading]);

  if (!isMounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-canvas transition-opacity duration-200 ${
        isFading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span className="font-display text-xl font-bold text-content">ContactHub</span>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
    </div>
  );
}
