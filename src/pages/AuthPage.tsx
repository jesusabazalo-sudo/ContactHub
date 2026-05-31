import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import SupabaseMissingAlert from '../components/system/SupabaseMissingAlert';
import { useAuth } from '../features/auth/AuthProvider';
import { checkRateLimit, getRateLimitMessage } from '../lib/rateLimit';
import { sanitizeEmail, sanitizeText } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type AuthMode = 'login' | 'register';
type OnboardingAnswers = {
  busca?: string;
  uso?: string;
  contacto?: string;
};

const TAGLINES = [
  'La información que otros no comparten.',
  'Más de 800 contactos organizados.',
  'Encuentra lo que necesitas hoy.',
];

const GEO_SHAPES = [
  ['triangle', 'left-[8%] top-[12%] h-8 w-8', 'geo-float', '0s'],
  ['diamond', 'left-[22%] top-[72%] h-10 w-10', 'geo-float-reverse', '1.2s'],
  ['hexagon', 'left-[76%] top-[14%] h-12 w-12', 'geo-pulse', '0.4s'],
  ['diamond', 'left-[88%] top-[62%] h-7 w-7', 'geo-float', '2s'],
  ['triangle', 'left-[14%] top-[44%] h-6 w-6', 'geo-pulse', '3s'],
  ['hexagon', 'left-[50%] top-[8%] h-9 w-9', 'geo-float-reverse', '1.8s'],
  ['diamond', 'left-[62%] top-[78%] h-8 w-8', 'geo-float', '3.4s'],
  ['triangle', 'left-[38%] top-[88%] h-7 w-7', 'geo-pulse', '2.7s'],
  ['hexagon', 'left-[6%] top-[84%] h-12 w-12 max-md:hidden', 'geo-float-reverse', '0.8s'],
  ['diamond', 'left-[92%] top-[28%] h-9 w-9 max-md:hidden', 'geo-pulse', '3.8s'],
  ['triangle', 'left-[34%] top-[26%] h-5 w-5 max-md:hidden', 'geo-float', '1.5s'],
  ['hexagon', 'left-[70%] top-[44%] h-6 w-6 max-md:hidden', 'geo-float-reverse', '2.6s'],
] as const;

const ONBOARDING_STEPS = [
  {
    key: 'busca',
    title: '¿Qué buscas principalmente?',
    options: ['🤖 Herramientas de IA', '📚 Cursos y recursos', '💰 Proveedores para vender', '🎯 Contactos de servicios', '🎵 Entretenimiento', '🔥 Todo me interesa'],
  },
  {
    key: 'uso',
    title: '¿Para qué usarás estos contactos?',
    options: ['🏢 Para mi negocio', '📱 Para uso personal', '🎓 Para aprender', '💼 Soy revendedor'],
  },
  {
    key: 'contacto',
    title: '¿Cómo prefieres que te contactemos si hay algo nuevo?',
    options: ['📱 WhatsApp', '📧 Solo por email', '🔕 No por ahora'],
  },
] as const;

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers>({});
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const { isLoading: isSessionLoading, resetPassword, session, signIn, signInWithGoogle, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasShownSessionNotice = useRef(false);
  const redirectTo = searchParams.get('redirect') || '/catalogo';
  const reason = searchParams.get('reason');
  const notice = useMemo(() => (reason === 'session-expired' ? 'Tu sesión expiró. Inicia sesión de nuevo.' : null), [reason]);
  const isRegisterMode = mode === 'register';
  const currentOnboarding = ONBOARDING_STEPS[onboardingStep];
  const currentAnswer = onboardingAnswers[currentOnboarding.key];

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'register' || requestedMode === 'login') setMode(requestedMode);
  }, [searchParams]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % TAGLINES.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (notice && !hasShownSessionNotice.current) {
      toast.message(notice);
      hasShownSessionNotice.current = true;
    }
  }, [notice]);

  useEffect(() => {
    if (isSessionLoading || !session || showOnboarding) return;
    const pendingOnboarding = window.localStorage.getItem('contacthub_pending_onboarding') === '1' || searchParams.get('onboarding') === '1';
    if (pendingOnboarding) {
      void startOnboardingIfNeeded();
      return;
    }
    navigate(redirectTo, { replace: true });
  }, [isSessionLoading, navigate, redirectTo, searchParams, session, showOnboarding]);

  async function hasCompletedOnboarding(userId: string) {
    if (!supabase || !isSupabaseConfigured) return false;
    const client = supabase as unknown as { from: (table: string) => any };
    const { data, error } = await client.from('profiles').select('onboarding_completed').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('No se pudo leer onboarding_completed:', error.message);
      return false;
    }
    return Boolean(data?.onboarding_completed);
  }

  async function startOnboardingIfNeeded() {
    if (!session?.user) return;
    const completed = await hasCompletedOnboarding(session.user.id);
    if (completed) {
      window.localStorage.removeItem('contacthub_pending_onboarding');
      navigate('/catalogo', { replace: true });
      return;
    }
    setOnboardingStep(0);
    setOnboardingAnswers({});
    setShowOnboarding(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const safeEmail = sanitizeEmail(email);
      const safeFullName = sanitizeText(fullName, 120);
      const key = `auth_${safeEmail}`;
      if (!checkRateLimit(key, 5, 60000)) {
        toast.error(getRateLimitMessage(60000));
        return;
      }

      if (mode === 'login') {
        await signIn(safeEmail, password);
        toast.success('Ya estás dentro.');
        setShowSuccessFlash(true);
        window.setTimeout(() => navigate(redirectTo, { replace: true }), 700);
      } else {
        await signUp({ email: safeEmail, password, fullName: safeFullName });
        window.localStorage.setItem('contacthub_pending_onboarding', '1');
        toast.success('Cuenta creada. Completa 3 pasos rápidos para empezar.');

        const { data } = supabase && isSupabaseConfigured ? await supabase.auth.getSession() : { data: { session: null } };
        if (data.session) {
          setShowOnboarding(true);
        } else {
          toast.message('Si Supabase pide confirmar correo, vuelve a iniciar sesión y verás el onboarding.');
          setMode('login');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo completar el acceso.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset() {
    const safeEmail = sanitizeEmail(email);
    if (!safeEmail) {
      toast.message('Escribe tu correo para enviarte la recuperación.');
      return;
    }

    try {
      await resetPassword(safeEmail);
      toast.success('Te enviamos las instrucciones al correo.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la recuperación.';
      toast.error(message);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function completeOnboarding() {
    if (!session?.user) {
      navigate('/catalogo', { replace: true });
      return;
    }

    setIsSavingOnboarding(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const client = supabase as unknown as { from: (table: string) => any };
        const { error } = await client
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_answers: onboardingAnswers,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.user.id);
        if (error) console.warn('No se pudo guardar onboarding:', error.message);
      }
    } catch (error) {
      console.warn('No se pudo guardar onboarding:', error);
    } finally {
      window.localStorage.removeItem('contacthub_pending_onboarding');
      setIsSavingOnboarding(false);
      setOnboardingDone(true);
      window.setTimeout(() => navigate('/catalogo', { replace: true }), 2000);
    }
  }

  function nextOnboardingStep() {
    if (!currentAnswer) {
      toast.message('Elige una opción para continuar.');
      return;
    }

    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep((current) => current + 1);
      return;
    }

    void completeOnboarding();
  }

  return (
    <section className={`relative min-h-screen overflow-hidden bg-[#0F2027] px-4 py-8 ${isLoading ? 'auth-loading' : ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(29,180,122,0.18),transparent_28rem),radial-gradient(circle_at_80%_70%,rgba(29,180,122,0.12),transparent_24rem)]" />

      {GEO_SHAPES.map(([shape, position, animation, delay], index) => (
        <span key={`${shape}-${index}`} className={`geo-shape geo-${shape} ${animation} ${position}`} style={{ animationDelay: delay }} />
      ))}

      {showSuccessFlash ? <div className="pointer-events-none fixed inset-0 z-[60] animate-auth-flash bg-brand-400" /> : null}

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[420px] items-center justify-center">
        <div className="w-full rounded-3xl border border-[rgba(29,180,122,0.3)] bg-[rgba(15,32,39,0.95)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[20px] sm:p-7">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 animate-logo-pulse place-items-center rounded-full bg-brand-400 text-xl font-black text-ink-950 shadow-[0_0_28px_rgba(29,180,122,0.42)]">
              CH
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-white">ContactHub</h1>
            <p key={taglineIndex} className="mt-2 animate-tagline-fade text-sm font-medium text-white sm:text-base">
              {TAGLINES[taglineIndex]}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-full border border-line bg-ink-950/70 p-1">
            <button type="button" onClick={() => setMode('login')} className={`focus-ring rounded-full px-4 py-2 text-sm font-bold transition ${mode === 'login' ? 'bg-brand-400 text-ink-950' : 'text-gray-300 hover:text-white'}`}>
              Login
            </button>
            <button type="button" onClick={() => setMode('register')} className={`focus-ring rounded-full px-4 py-2 text-sm font-bold transition ${mode === 'register' ? 'bg-brand-400 text-ink-950' : 'text-gray-300 hover:text-white'}`}>
              Registro
            </button>
          </div>

          {isRegisterMode ? (
            <div className="mt-5 rounded-2xl border border-brand-400/25 bg-brand-400/10 p-4 text-sm leading-6 text-[rgba(255,255,255,0.85)]">
              <p className="font-bold text-white">👋 Bienvenido a ContactHub</p>
              <p className="mt-3">
                Aquí encuentras contactos directos de proveedores, vendedores y oportunidades digitales, organizados en 24 categorías para que llegues directo a lo que buscas.
              </p>
              <p className="mt-3 font-semibold text-brand-200">Sin intermediarios. Sin perder tiempo.</p>
            </div>
          ) : null}

          {!isSupabaseConfigured ? <SupabaseMissingAlert className="mt-5" /> : null}
          {notice ? <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{notice}</div> : null}

          <div className="mt-5 rounded-2xl border border-brand-400/25 bg-brand-400/10 p-4 text-sm leading-6 text-[rgba(255,255,255,0.85)]">
            <p className="font-bold text-white">Tu correo es tu llave de acceso</p>
            <p className="mt-2">
              Usamos tu correo para guardar tus carpetas desbloqueadas, registrar tu prueba gratis y asociar comprobantes. No pedimos tu contraseña de Gmail, no vendemos tu información y no publicamos tu correo.
            </p>
            <p className="mt-2 text-brand-100">
              Puedes explorar primero y registrarte cuando quieras guardar un acceso.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isLoading}
            className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-line bg-white/[0.08] px-5 text-sm font-bold text-white transition hover:border-brand-400/45 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-ink-950">G</span>
            Continuar con Google
          </button>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {isRegisterMode ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white/90">Nombre</span>
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="focus-ring h-12 min-h-12 w-full rounded-2xl border border-line bg-white/[0.08] pl-11 pr-4 text-[16px] text-white placeholder:text-white/40" placeholder="Tu nombre" autoComplete="name" />
                </span>
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/90">Correo</span>
              <span className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="focus-ring h-12 min-h-12 w-full rounded-2xl border border-line bg-white/[0.08] pl-11 pr-4 text-[16px] text-white placeholder:text-white/40" placeholder="tu@email.com" autoComplete="email" />
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/90">Contraseña</span>
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input required value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} minLength={6} className="focus-ring h-12 min-h-12 w-full rounded-2xl border border-line bg-white/[0.08] pl-11 pr-12 text-[16px] text-white placeholder:text-white/40" placeholder="Mínimo 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="focus-ring absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-gray-400 hover:text-white" aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="focus-ring btn-primary-glow mt-2 inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-brand-400 px-5 text-sm font-black text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-75">
              {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" /> : null}
              {isLoading ? 'Entrando...' : mode === 'login' ? 'Entrar a ContactHub' : 'Crear cuenta segura'}
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('register')} className="focus-ring inline-flex h-11 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-400/10 px-4 text-xs font-bold text-brand-100 transition hover:bg-brand-400 hover:text-ink-950">
              Crear cuenta segura
            </button>
            <button type="button" onClick={() => navigate('/catalogo')} className="focus-ring inline-flex h-11 items-center justify-center rounded-2xl border border-line bg-white/5 px-4 text-xs font-bold text-white transition hover:border-brand-400/40">
              Explorar sin registrarme
            </button>
          </div>

          <div className="mt-4 grid gap-1 rounded-2xl border border-line bg-white/[0.03] p-4 text-xs leading-5 text-gray-400">
            <p>Registro necesario solo para guardar tus accesos.</p>
            <p>Tu correo funciona como tu llave de entrada.</p>
            <p>Sin cuenta puedes explorar. Con cuenta puedes desbloquear.</p>
            <p>No pedimos contraseña si usas un proveedor externo; el acceso lo gestiona ese proveedor de autenticación.</p>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3 text-center text-sm">
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="focus-ring rounded-full px-3 py-2 font-semibold text-brand-200 hover:text-white">
              {mode === 'login' ? '¿Nuevo aquí? Crea tu cuenta gratis' : 'Ya tengo cuenta, quiero entrar'}
            </button>
            <button type="button" onClick={handlePasswordReset} className="focus-ring rounded-full px-3 py-2 text-xs font-semibold text-gray-500 transition hover:text-white">
              Olvidé mi contraseña
            </button>
          </div>
        </div>
      </div>

      {showOnboarding ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-brand-400/20 bg-[#0F2027] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.48)] sm:p-7">
            {onboardingDone ? (
              <div className="relative py-12 text-center">
                <div className="onboarding-confetti" />
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-400 text-2xl">✅</div>
                <h2 className="mt-5 font-display text-2xl font-bold text-white">¡Listo! Ya tienes acceso a ContactHub.</h2>
                <p className="mt-3 text-sm text-gray-400">Te llevamos al catálogo para que empieces a explorar.</p>
              </div>
            ) : (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand-400 transition-all duration-300" style={{ width: `${((onboardingStep + 1) / ONBOARDING_STEPS.length) * 100}%` }} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{onboardingStep + 1}/3</p>
                <div key={currentOnboarding.key} className="animate-onboarding-slide">
                  <h2 className="mt-3 font-display text-2xl font-bold text-white">{currentOnboarding.title}</h2>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {currentOnboarding.options.map((option) => {
                      const value = option.replace(/^[^\s]+\s/, '');
                      const selected = currentAnswer === value;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setOnboardingAnswers((current) => ({ ...current, [currentOnboarding.key]: value }))}
                          className={`focus-ring rounded-full border px-4 py-3 text-sm font-bold transition ${
                            selected ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-gray-300 hover:border-brand-400/40 hover:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="button" disabled={isSavingOnboarding} onClick={nextOnboardingStep} className="focus-ring mt-7 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-400 px-5 text-sm font-black text-ink-950 transition hover:bg-white disabled:opacity-70">
                  {onboardingStep === ONBOARDING_STEPS.length - 1 ? (isSavingOnboarding ? 'Guardando...' : 'Finalizar →') : 'Siguiente →'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
