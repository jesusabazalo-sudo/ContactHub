import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ProfileWelcome = {
  full_name?: string | null;
  email?: string | null;
  onboarding_completed?: boolean | null;
};

export default function WelcomeModal() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileWelcome | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const welcomeKey = useMemo(() => (user?.id ? `welcome_shown_${user.id}` : ''), [user?.id]);
  const lastWelcomeKey = useMemo(() => (user?.id ? `last_welcome_${user.id}` : ''), [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileAndWelcome() {
      if (isLoading || !user?.id) return;

      let nextProfile: ProfileWelcome = {
        full_name: user.user_metadata?.full_name ?? null,
        email: user.email ?? null,
        onboarding_completed: true,
      };

      if (supabase && isSupabaseConfigured) {
        try {
          const client = supabase as unknown as { from: (table: string) => any };
          const { data, error } = await client.from('profiles').select('full_name,email,onboarding_completed').eq('id', user.id).maybeSingle();
          if (!error && data) nextProfile = data;
        } catch (error) {
          console.warn('No se pudo cargar perfil para bienvenida:', error);
        }
      }

      if (cancelled) return;
      setProfile(nextProfile);

      const welcomeShown = window.localStorage.getItem(welcomeKey) === 'true';
      const completed = nextProfile.onboarding_completed !== false;

      if (!welcomeShown && completed) {
        setIsOpen(true);
        return;
      }

      if (welcomeShown) {
        const lastWelcome = Number(window.localStorage.getItem(lastWelcomeKey) ?? 0);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - lastWelcome > oneHour) {
          const name = nextProfile.full_name || nextProfile.email || user.email || 'usuario';
          toast.message(`👋 Bienvenido de vuelta, ${name}`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#0d2a1f',
              border: '1px solid rgba(29,180,122,0.45)',
              color: '#fff',
            },
          });
          window.localStorage.setItem(lastWelcomeKey, String(Date.now()));
        }
      }
    }

    void loadProfileAndWelcome();
    return () => {
      cancelled = true;
    };
  }, [isLoading, lastWelcomeKey, user, welcomeKey]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(closeWelcome, 6000);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  function closeWelcome() {
    if (welcomeKey) window.localStorage.setItem(welcomeKey, 'true');
    if (lastWelcomeKey) window.localStorage.setItem(lastWelcomeKey, String(Date.now()));
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <div className="welcome-particles absolute inset-0" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-brand-400/30 bg-[#0F2027] p-6 text-center shadow-[0_26px_90px_rgba(0,0,0,0.55)] sm:p-8">
        <div className="onboarding-confetti" />
        <div className="text-6xl">🎉</div>
        <h2 className="mt-5 font-display text-3xl font-bold text-white">¡Bienvenido a ContactHub!</h2>
        <p className="mt-2 text-lg font-bold text-brand-200">Tomaste una decisión inteligente.</p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/80">
          Aquí tienes acceso a más de 800 contactos directos organizados para que encuentres exactamente lo que buscas.
          Esperamos que encuentres lo que necesitas, y más. Cualquier duda, estamos aquí.
        </p>
        {profile?.full_name ? <p className="mt-4 text-xs font-semibold text-gray-500">Hola, {profile.full_name}.</p> : null}
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="welcome-progress h-full rounded-full bg-brand-400" />
        </div>
        <button
          type="button"
          onClick={closeWelcome}
          className="focus-ring btn-primary-glow mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-brand-400 px-5 py-3 text-sm font-black text-ink-950 transition hover:bg-white"
        >
          Entrar a ContactHub →
        </button>
      </div>
    </div>
  );
}
