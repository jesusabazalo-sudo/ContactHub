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
import { sanitizeText, sanitizeTextInput } from '../lib/sanitize';
import { getMyContactsData, type MyContactsData, type UnlockedContact } from '../services/myContactsService';
import { formatPhone } from '../utils/phone';

const TOTAL_FOLDERS = 24;

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function MyContactsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyContactsData | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMyContacts() {
    if (!user?.id) return;

    setIsLoading(true);
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
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMyContacts();
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
    return <EmptyContactsState userEmail={user?.email ?? null} totalFolders={TOTAL_FOLDERS} />;
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
                Sesión activa: {user.email}
              </p>
            ) : null}
            <h1 className="font-display text-4xl font-bold leading-tight text-white">Tu camino dentro de ContactHub.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
              Aquí ves tus carpetas activas, tus contactos disponibles y el progreso hacia un acceso más completo.
            </p>
          </div>
          <button
            type="button"
            onClick={loadMyContacts}
            className="focus-ring inline-flex w-fit items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="dopamine-card neon-edge mt-8 rounded-2xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-400">Resumen de acceso</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">
                {unlockedCount} de {TOTAL_FOLDERS} carpetas desbloqueadas
              </p>
            </div>
            <p className="text-sm text-gray-400">{data.contacts.length} contactos visibles en acceso rápido</p>
          </div>
          <ProgressBar value={progress} className="mt-5" />
        </div>

        <div className="mt-6">
          <QuickGuide />
        </div>

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

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setActiveCategoryId(folder.id)}
              className={`focus-ring card-hover rounded-2xl border p-5 text-left transition ${
                activeCategoryId === folder.id ? 'border-brand-400/50 bg-brand-400/10 shadow-[0_0_28px_rgba(34,197,94,0.12)]' : 'border-line bg-panel hover:border-brand-400/30'
              }`}
            >
              <p className="text-lg font-bold text-white">{folder.name}</p>
              <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">{folder.shortDescription || folder.description}</p>
              <p className="mt-4 text-sm font-semibold text-brand-400">{folder.contactsCount} contactos en carpeta</p>
            </button>
          ))}
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

function EmptyContactsState({ userEmail, totalFolders }: { userEmail: string | null; totalFolders: number }) {
  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell">
        <div className="dopamine-card neon-edge mx-auto max-w-5xl rounded-3xl p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              {userEmail ? (
                <p className="mb-5 inline-flex rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-400">
                  Sesión activa: {userEmail}
                </p>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">Tu progreso de acceso</p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Todavía no tienes ninguna carpeta desbloqueada, pero ya puedes empezar.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                Aún no tienes carpetas desbloqueadas, pero ya puedes explorar lo que hay. Cada acceso te acerca a los contactos que pueden ayudarte a avanzar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
        <MissionsSection compact />
      </div>
    </section>
  );
}

function UnlockedContactCard({ contact, folderName }: { contact: UnlockedContact; folderName?: string }) {
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(formatPhone(contact.phone));
      toast.success('Número copiado.');
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


