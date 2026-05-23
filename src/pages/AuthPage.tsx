import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import SupabaseMissingAlert from '../components/system/SupabaseMissingAlert';
import SectionHeading from '../components/ui/SectionHeading';
import { useAuth } from '../features/auth/AuthProvider';
import { checkRateLimit, getRateLimitMessage } from '../lib/rateLimit';
import { sanitizeEmail, sanitizeText } from '../lib/sanitize';
import { isSupabaseConfigured } from '../lib/supabaseClient';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isLoading: isSessionLoading, resetPassword, session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasShownSessionNotice = useRef(false);
  const redirectTo = searchParams.get('redirect') || '/catalogo';
  const reason = searchParams.get('reason');
  const notice = useMemo(() => {
    if (reason === 'session-expired') {
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    }

    return null;
  }, [reason]);

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'register' || requestedMode === 'login') {
      setMode(requestedMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      navigate(redirectTo, { replace: true });
    }
  }, [isSessionLoading, navigate, redirectTo, session]);

  useEffect(() => {
    if (notice && !hasShownSessionNotice.current) {
      toast.message(notice);
      hasShownSessionNotice.current = true;
    }
  }, [notice]);

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
      } else {
        await signUp({
          email: safeEmail,
          password,
          fullName: safeFullName,
        });
        toast.success('Cuenta creada. Ya puedes explorar ContactHub gratis.');
      }

      navigate(redirectTo, { replace: true });
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

  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Registro gratis"
            title="Crea tu cuenta y empieza a explorar"
            description="No necesitas comprar para entrar. Puedes revisar categorías, entender qué existe y ver teléfonos protegidos hasta desbloquear acceso."
          />
          <div className="mt-8 grid gap-4">
            {[
              ['Explora sin presión', 'Revisa qué existe dentro de ContactHub antes de decidir qué desbloquear.'],
              ['Teléfonos protegidos', 'Los números completos solo aparecen con acceso, prueba gratuita o recompensa aprobada.'],
              ['También puedes ganar', 'Si ahora no puedes pagar, completa misiones y envía evidencia para revisión.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-line bg-panel p-5">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-8">
          <div className="grid grid-cols-2 rounded-full border border-line bg-ink-950/70 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-bold transition ${
                mode === 'login' ? 'bg-brand-400 text-ink-950' : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-bold transition ${
                mode === 'register' ? 'bg-brand-400 text-ink-950' : 'text-gray-300 hover:text-white'
              }`}
            >
              Registro
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <SupabaseMissingAlert className="mt-6" />
          ) : null}

          {notice ? (
            <div className="mt-6 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{notice}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {mode === 'register' ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Nombre</span>
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="focus-ring h-12 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-white placeholder:text-gray-500"
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </span>
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Correo</span>
              <span className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="focus-ring h-12 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-white placeholder:text-gray-500"
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Contraseña</span>
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  minLength={6}
                  className="focus-ring h-12 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-white placeholder:text-gray-500"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="focus-ring mt-2 inline-flex h-12 items-center justify-center rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Procesando...' : mode === 'login' ? 'Entrar a ContactHub' : 'Crear cuenta gratis'}
            </button>
          </form>

          <button
            type="button"
            onClick={handlePasswordReset}
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gray-400 transition hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Recuperar contraseña
          </button>
        </div>
      </div>
    </section>
  );
}
