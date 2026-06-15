import { Clipboard, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MissionsSection from '../components/missions/MissionsSection';
import QuickGuide from '../components/onboarding/QuickGuide';
import FriendlyErrorState from '../components/system/FriendlyErrorState';
import LoadingState from '../components/system/LoadingState';
import ProgressBar from '../components/ui/ProgressBar';
import { useAuth } from '../features/auth/AuthProvider';
import { useAutofillProfile } from '../hooks/useAutofillProfile';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { buildContactWhatsAppMessage, buildWhatsAppLink } from '../lib/whatsapp';
import { getMyContactsData, type MyContactsData, type UnlockedContact } from '../services/myContactsService';
import { formatPhone } from '../utils/phone';

const TOTAL_FOLDERS = 24;

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function MyContactsPage() {
  const { user } = useAuth();
  const autofill = useAutofillProfile();
  const [data, setData] = useState<MyContactsData | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMyContacts(options?: { silent?: boolean }) {
    if (!user?.id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const nextData = await getMyContactsData(user.id);
      const nextUnlockedCount = nextData.folders.length;
      const storageKey = `contacthub:unlocked-folders:${user.id}`;
      const previousValue = window.localStorage.getItem(storageKey);

      if (previousValue !== null && nextUnlockedCount > Number(previousValue)) {
        toast.success('🎉 ¡Acceso desbloqueado! Tu nueva carpeta ya está disponible.');
      }

      window.localStorage.setItem(storageKey, String(nextUnlockedCount));
      setData(nextData);
      if (nextData.folders.length && activeCategoryId !== 'all' && !nextData.folders.some((folder) => folder.id === activeCategoryId)) {
        setActiveCategoryId('all');
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus contactos.';
      if (options?.silent && data) {
        toast.error('No se pudieron actualizar tus accesos. Conservamos los datos anteriores.');
        if (import.meta.env.DEV) console.error('[MyContactsPage] silent refresh:', loadError);
      } else {
        setError(message);
      }
    } finally {
      if (options?.silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMyContacts();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    const client = supabase;
    const channel = client
      .channel(`my-access-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_category_access', filter: `user_id=eq.${user.id}` }, () => {
        void loadMyContacts({ silent: true });
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadMyContacts({ silent: true });
      }
    };
    const refreshOnPageShow = () => void loadMyContacts({ silent: true });

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('pageshow', refreshOnPageShow);

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('pageshow', refreshOnPageShow);
    };
  }, [user?.id]);

  const filteredContacts = useMemo(() => {
    const contacts = data?.contacts ?? [];
    const normalizedQuery = sanitizeText(query, 80).toLowerCase();

    return contacts.filter((contact) => {
      const matchesCategory = activeCategoryId === 'all' || contact.categoryId === activeCategoryId;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [contact.name, contact.description, contact.phone, contact.phoneMasked, ...contact.tags].join(' ').toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategoryId, data?.contacts, query]);

  if (isLoading) {
    return <LoadingState title="Cargando tus contactos" message="Estamos revisando tus carpetas desbloqueadas en Supabase." />;
  }

  if (error) {
    return <FriendlyErrorState message={error} onRetry={loadMyContacts} />;
  }

  if (!data?.folders.length) {
    return (
      <EmptyContactsState
        userEmail={user?.email ?? null}
        totalFolders={TOTAL_FOLDERS}
        isRefreshing={isRefreshing}
        onRefresh={() => void loadMyContacts({ silent: true })}
      />
    );
  }

  const unlockedCount = data.folders.length;
  const progress = Math.min(100, Math.round((unlockedCount / TOTAL_FOLDERS) * 100));
  const needsForPower = Math.max(0, 4 - unlockedCount);

  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {user?.email ? (
              <p className="mb-4 inline-flex rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-400">
                Sesión activa: {autofill.email || user.email}
              </p>
            ) : null}
            {autofill.fullName || autofill.displayName ? (
              <p className="mb-2 text-base font-semibold text-white">Hola, {autofill.displayName || autofill.fullName} 👋</p>
            ) : null}
            <h1 className="font-display text-4xl font-bold leading-tight text-white">Tu camino dentro de ContactHub.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
              Aquí ves tus carpetas activas, tus contactos disponibles y el progreso hacia un acceso más completo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMyContacts({ silent: true })}
            disabled={isRefreshing}
            className="focus-ring inline-flex w-fit items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar mis accesos'}
          </button>
        </div>

        <div className="dopamine-card neon-edge mt-8 rounded-2xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-400">Resumen de acceso</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">
                {unlockedCount} de {TOTAL_FOLDERS} carpetas desbloqueadas
              </p>
              <p className="mt-2 text-sm text-gray-300">Ya tienes carpetas desbloqueadas. Puedes ver tus contactos completos aqui.</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-brand-400">{progress}%</p>
              <p className="mt-1 text-sm text-gray-400">{data.contacts.length} contactos visibles</p>
            </div>
          </div>
          <ProgressBar value={progress} className="mt-5" />
        </div>

        <div className="mt-6">
          <QuickGuide />
        </div>

        <ProfileDataCard autofill={autofill} />

        {unlockedCount >= 1 && unlockedCount <= 3 ? (
          <div className="dopamine-card neon-edge mt-6 rounded-2xl p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-6 text-gray-200">
                Tienes {unlockedCount} carpetas. Si agregas {needsForPower} más llegas al Pack Power y desbloqueas más valor. ¿Te interesa?
              </p>
              <button
                type="button"
                onClick={() => openSupportChat(`Hola, tengo ${unlockedCount} carpeta(s) en ContactHub y quiero saber cómo llegar al Pack Power.`)}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por chat
              </button>
            </div>
          </div>
        ) : null}

        <MissionsSection compact />

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Tus carpetas desbloqueadas</h2>
              <p className="mt-1 text-sm text-gray-400">Selecciona una carpeta para ver solamente sus contactos.</p>
            </div>
            <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-300">
              {unlockedCount} activas
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setActiveCategoryId(folder.id)}
                className={`focus-ring card-hover rounded-2xl border p-5 text-left transition ${
                  activeCategoryId === folder.id
                    ? 'border-brand-400/50 bg-brand-400/10 shadow-[0_0_28px_rgba(34,197,94,0.12)]'
                    : 'border-line bg-panel hover:border-brand-400/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-bold text-white">{folder.name}</p>
                  <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-1 text-[10px] font-bold uppercase text-brand-300">
                    Activa
                  </span>
                </div>
                <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">{folder.shortDescription || folder.description}</p>
                <p className="mt-4 text-sm font-semibold text-brand-400">{folder.contactsCount} contactos en carpeta</p>
                <p className="mt-3 text-xs font-bold text-white">Ver contactos →</p>
              </button>
            ))}
          </div>
        </div>

        <div className="dopamine-card mt-8 rounded-2xl p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">Buscar dentro de mis contactos</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(sanitizeTextInput(event.target.value, 80))}
                placeholder="Buscar por nombre, descripción, teléfono o tag"
                className="focus-ring h-12 w-full rounded-full border border-line bg-ink-950/70 pl-11 pr-4 text-sm text-white placeholder:text-gray-500"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className={`focus-ring rounded-full border px-4 py-2 text-sm font-bold transition ${
                  activeCategoryId === 'all' ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-gray-300'
                }`}
              >
                Todas
              </button>
              {data.folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setActiveCategoryId(folder.id)}
                  className={`focus-ring rounded-full border px-4 py-2 text-sm font-bold transition ${
                    activeCategoryId === folder.id ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-gray-300'
                  }`}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Acceso rápido</h2>
              <p className="mt-1 text-sm text-gray-400">Todos tus contactos desbloqueados en una sola búsqueda.</p>
            </div>
            <p className="text-sm text-gray-400">{filteredContacts.length} resultado(s)</p>
          </div>

          {filteredContacts.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredContacts.map((contact) => (
                <UnlockedContactCard key={contact.id} contact={contact} folderName={data.folders.find((folder) => folder.id === contact.categoryId)?.name} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-panel p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-white">No hay contactos con ese filtro.</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">Prueba con otra carpeta o una búsqueda más amplia.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyContactsState({
  userEmail,
  totalFolders,
  isRefreshing,
  onRefresh,
}: {
  userEmail: string | null;
  totalFolders: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const autofill = useAutofillProfile();

  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell">
        <div className="dopamine-card neon-edge mx-auto max-w-5xl rounded-3xl p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              {userEmail ? (
                <p className="mb-5 inline-flex rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-400">
                  Sesión activa: {autofill.email || userEmail}
                </p>
              ) : null}
              {autofill.fullName || autofill.displayName ? (
                <p className="mb-3 text-base font-semibold text-white">Hola, {autofill.displayName || autofill.fullName} 👋</p>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">Tu progreso de acceso</p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Todavía no tienes ninguna carpeta desbloqueada, pero ya puedes empezar.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                Aún no tienes carpetas desbloqueadas, pero ya puedes explorar lo que hay. Cada acceso te acerca a los contactos que pueden ayudarte a avanzar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-brand-400/35 bg-brand-400/10 px-5 py-3 text-sm font-bold text-brand-100 transition hover:bg-brand-400 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualizando...' : 'Actualizar mis accesos'}
                </button>
                <Link to="/?trial=1" className="focus-ring rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white">
                  Ver prueba gratis
                </Link>
                <Link
                  to="/catalogo"
                  className="focus-ring rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
                >
                  Explorar catálogo
                </Link>
                <button
                  type="button"
                  onClick={() => openSupportChat('Hola, quiero desbloquear una carpeta de ContactHub. ¿Qué opción me recomiendas?')}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-brand-400/35 bg-brand-400/10 px-5 py-3 text-sm font-bold text-brand-100 transition hover:bg-brand-400 hover:text-ink-950"
                >
                  <MessageCircle className="h-4 w-4" />
                  Escribir por chat
                </button>
                <button
                  type="button"
                  onClick={() => openSupportChat('Hola, quiero ganar un contacto gratis con una misión. ¿Qué puedo hacer?')}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
                >
                  Ganar contacto gratis
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-400/25 bg-ink-950/70 p-5 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-400">Carpetas desbloqueadas</p>
                  <p className="mt-2 font-display text-4xl font-bold text-white">0%</p>
                </div>
                <p className="pb-1 text-sm font-semibold text-brand-300">0 de {totalFolders}</p>
              </div>
              <ProgressBar value={0} className="mt-5" />
              <p className="mt-5 text-sm leading-6 text-gray-400">
                Cuando actives tu primera carpeta, esta barra subirá automáticamente y verás tus contactos completos aquí.
              </p>
              <button
                type="button"
                onClick={() => openSupportChat('Hola, quiero saber cómo desbloquear mi primera carpeta en ContactHub.')}
                className="focus-ring mt-5 w-full rounded-full bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400 hover:text-ink-950"
              >
                Desbloquear una carpeta
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <QuickGuide />
        </div>
        <ProfileDataCard autofill={autofill} />
        <MissionsSection compact />
      </div>
    </section>
  );
}

function ProfileDataCard({ autofill }: { autofill: ReturnType<typeof useAutofillProfile> }) {
  const [name, setName] = useState(autofill.fullName || autofill.displayName);
  const [whatsapp, setWhatsapp] = useState(autofill.whatsapp || autofill.phone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(autofill.fullName || autofill.displayName);
    setWhatsapp(autofill.whatsapp || autofill.phone);
  }, [autofill.fullName, autofill.displayName, autofill.whatsapp, autofill.phone]);

  async function saveProfile() {
    if (!autofill.userId || !supabase || !isSupabaseConfigured) {
      toast.error('Inicia sesión para guardar tus datos.');
      return;
    }

    setIsSaving(true);
    try {
      const client = supabase as unknown as { from: (table: string) => any };
      const safeName = sanitizeText(name, 160);
      const safeWhatsapp = sanitizePhone(whatsapp);
      const { error } = await client
        .from('profiles')
        .update({
          full_name: safeName || null,
          display_name: safeName || null,
          whatsapp: safeWhatsapp || null,
          phone: safeWhatsapp || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', autofill.userId);

      if (error) throw error;
      await autofill.refreshProfile();
      toast.success('Datos guardados para autorrelleno.');
    } catch (error) {
      if (import.meta.env.DEV) console.error('ProfileDataCard:', error);
      toast.error('No se pudieron guardar tus datos.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dopamine-card neon-edge mt-6 rounded-2xl p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-400">Mis datos</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">Autorrelleno para ContactHub</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Usamos estos datos solo para gestionar tu cuenta, accesos, comprobantes y soporte.
          </p>
        </div>
        <p className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
          {autofill.loading ? 'Sincronizando...' : 'Datos privados'}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Correo</span>
          <input
            value={autofill.email}
            readOnly
            className="h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-gray-400"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Nombre</span>
          <input
            value={name}
            onChange={(event) => setName(sanitizeTextInput(event.target.value, 160))}
            placeholder="Tu nombre"
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white placeholder:text-gray-500"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">WhatsApp</span>
          <input
            value={whatsapp}
            onChange={(event) => setWhatsapp(sanitizePhone(event.target.value))}
            placeholder="+51 9..."
            className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 font-mono text-sm text-white placeholder:text-gray-500"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void saveProfile()}
        disabled={isSaving || !autofill.userId}
        className="focus-ring mt-5 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Guardando...' : 'Guardar datos'}
      </button>
    </div>
  );
}

function UnlockedContactCard({ contact, folderName }: { contact: UnlockedContact; folderName?: string }) {
  const whatsappUrl = buildWhatsAppLink(
    contact.phone,
    buildContactWhatsAppMessage(contact.name, folderName ?? 'ContactHub'),
  );

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(formatPhone(contact.phone));
      toast.success('Número copiado');
    } catch {
      toast.error('No se pudo copiar el número.');
    }
  }

  return (
    <article className="card-hover dopamine-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-brand-400">{folderName ?? 'Carpeta desbloqueada'}</p>
          <h3 className="mt-2 text-lg font-bold text-white">{contact.name}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-400">{contact.description || 'Contacto desbloqueado desde Supabase.'}</p>
        </div>

      </div>

      <div className="mt-5 rounded-lg border border-brand-400/25 bg-brand-400/10 p-4">
        <p className="text-xs font-semibold uppercase text-brand-400">Teléfono visible</p>
        <p className="mt-1 font-mono text-xl font-bold text-white">{formatPhone(contact.phone)}</p>
        <p className="mt-1 text-xs text-gray-400">Vista segura: este número no sale de previews públicos.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {contact.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-gray-300">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1db857] active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            Consultar por WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/35"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp no disponible
          </button>
        )}
        <button
          type="button"
          onClick={copyPhone}
          className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
        >
          <Clipboard className="h-4 w-4" />
          Copiar número
        </button>
      </div>
    </article>
  );
}


