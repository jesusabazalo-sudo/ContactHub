import { RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import DashboardBottomTabs from '../components/dashboard/DashboardBottomTabs';
import type { DashboardSection } from '../components/dashboard/dashboardSections';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import FoldersSection from '../components/dashboard/FoldersSection';
import RecentActivitySection from '../components/dashboard/RecentActivitySection';
import SettingsSection from '../components/dashboard/SettingsSection';
import StatsSection from '../components/dashboard/StatsSection';
import MissionsSection from '../components/missions/MissionsSection';
import QuickGuide from '../components/onboarding/QuickGuide';
import FriendlyErrorState from '../components/system/FriendlyErrorState';
import LoadingState from '../components/system/LoadingState';
import { useAuth } from '../features/auth/AuthProvider';
import { useAutofillProfile } from '../hooks/useAutofillProfile';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getRecentActivity, type RecentActivity } from '../lib/activityTracking';
import { CACHE_TTL, queryCache } from '../lib/queryCache';
import { sanitizeTextInput } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getMyContactsData, type MyContactsData } from '../services/myContactsService';

const SILENT_REFRESH_COOLDOWN_MS = 90_000;

const SECTION_COPY: Record<DashboardSection, { title: string; subtitle: string }> = {
  folders: { title: 'Mis carpetas', subtitle: 'Tus carpetas activas y los contactos disponibles en cada una.' },
  recent: { title: 'Contactos recientes', subtitle: 'Los últimos contactos que copiaste o contactaste por WhatsApp.' },
  stats: { title: 'Mis estadísticas', subtitle: 'Un resumen visual de tu actividad en ContactHub.' },
  settings: { title: 'Configuración', subtitle: 'Tu cuenta, soporte y accesos.' },
};

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function MyContactsPage() {
  const { user, signOut } = useAuth();
  const autofill = useAutofillProfile();
  const [activeSection, setActiveSection] = useState<DashboardSection>('folders');
  const [data, setData] = useState<MyContactsData | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const lastSilentRefreshRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 350);

  const loadMyContacts = useCallback(async (options?: { silent?: boolean }) => {
    const requestUserId = user?.id ?? null;
    if (!requestUserId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const cacheKey = `mycontacts:${requestUserId}`;
      if (options?.silent) queryCache.invalidate(cacheKey);
      const nextData = await queryCache.withCache(cacheKey, CACHE_TTL.userData, () => getMyContactsData(requestUserId));
      if (currentUserIdRef.current !== requestUserId) return; // usuario cambió mientras cargaba: descarta respuesta obsoleta

      const nextUnlockedCount = nextData.folders.length;
      const storageKey = `contacthub:unlocked-folders:${requestUserId}`;
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
      if (currentUserIdRef.current !== requestUserId) return;
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus contactos.';
      if (options?.silent && data) {
        toast.error('No se pudieron actualizar tus accesos. Conservamos los datos anteriores.');
        if (import.meta.env.DEV) console.error('[MyContactsPage] silent refresh:', loadError);
      } else {
        setError(message);
      }
    } finally {
      if (currentUserIdRef.current === requestUserId) {
        if (options?.silent) setIsRefreshing(false);
        else setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
    void loadMyContacts();
  }, [user?.id, loadMyContacts]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setActivity([]);
      setIsActivityLoading(false);
      return undefined;
    }

    setIsActivityLoading(true);
    void queryCache
      .withCache(`activity:${user.id}`, CACHE_TTL.userData, () => getRecentActivity(user.id))
      .then((result) => {
        if (!cancelled) setActivity(result);
      })
      .finally(() => {
        if (!cancelled) setIsActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
  }, [user?.id, loadMyContacts]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshWhenVisible = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastSilentRefreshRef.current > SILENT_REFRESH_COOLDOWN_MS) {
        lastSilentRefreshRef.current = now;
        void loadMyContacts({ silent: true });
      }
    };
    const refreshOnPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        lastSilentRefreshRef.current = Date.now();
        void loadMyContacts({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('pageshow', refreshOnPageShow);

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('pageshow', refreshOnPageShow);
    };
  }, [user?.id, loadMyContacts]);

  const foldersById = useMemo(() => new Map((data?.folders ?? []).map((folder) => [folder.id, folder])), [data?.folders]);
  const contactsById = useMemo(() => new Map((data?.contacts ?? []).map((contact) => [contact.id, contact])), [data?.contacts]);

  const filteredContacts = useMemo(() => {
    const contacts = data?.contacts ?? [];
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return contacts
      .filter((contact) => activeCategoryId === 'all' || contact.categoryId === activeCategoryId)
      .filter((contact) => {
        if (!normalizedQuery) return true;
        return (
          contact.name.toLowerCase().includes(normalizedQuery) ||
          contact.description.toLowerCase().includes(normalizedQuery) ||
          contact.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
      })
      .map((contact) => ({ ...contact, categoryName: foldersById.get(contact.categoryId)?.name ?? '' }));
  }, [activeCategoryId, data?.contacts, debouncedQuery, foldersById]);

  const usedByCategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    activity.forEach((item) => {
      if (!map.has(item.categoryId)) map.set(item.categoryId, new Set());
      map.get(item.categoryId)!.add(item.contactId);
    });
    const result = new Map<string, number>();
    map.forEach((contactIds, categoryId) => result.set(categoryId, contactIds.size));
    return result;
  }, [activity]);

  const usedThisMonth = useMemo(() => {
    const now = new Date();
    const uniqueContacts = new Set(
      activity
        .filter((item) => {
          const date = new Date(item.createdAt);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .map((item) => item.contactId),
    );
    return uniqueContacts.size;
  }, [activity]);

  const totalContacts = data?.contacts.length ?? 0;

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('Sesión cerrada.');
    } catch (signOutError) {
      const message = signOutError instanceof Error ? signOutError.message : 'No se pudo cerrar sesión.';
      toast.error(message);
    }
  }

  if (isLoading) {
    return <LoadingState title="Cargando tu panel" message="Estamos revisando tus carpetas desbloqueadas en Supabase." />;
  }

  if (error) {
    return <FriendlyErrorState message={error} onRetry={loadMyContacts} />;
  }

  const sectionCopy = SECTION_COPY[activeSection];

  return (
    <div className="flex min-h-screen bg-canvas">
      <DashboardSidebar
        email={user?.email ?? null}
        displayName={autofill.displayName || autofill.fullName || null}
        memberSince={user?.created_at ?? null}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container-shell max-w-5xl py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-content sm:text-3xl">{sectionCopy.title}</h1>
              <p className="mt-2 text-sm leading-6 text-content-secondary">{sectionCopy.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadMyContacts({ silent: true })}
              disabled={isRefreshing}
              className="focus-ring inline-flex w-fit items-center justify-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-bold text-content transition hover:border-brand/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {activeSection === 'folders' ? (
            <label className="relative mt-6 block">
              <span className="sr-only">Buscar dentro de mis contactos</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(sanitizeTextInput(event.target.value, 80))}
                placeholder="Buscar por nombre, descripción o tag"
                className="focus-ring h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-content placeholder:text-content-muted"
              />
              {query !== debouncedQuery ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-text">Buscando...</span> : null}
            </label>
          ) : null}

          <div className="mt-6">
            {activeSection === 'folders' ? (
              <div className="space-y-6">
                <QuickGuide />
                <MissionsSection compact />
                <FoldersSection
                  folders={data?.folders ?? []}
                  accessHistory={data?.accessHistory ?? []}
                  activeCategoryId={activeCategoryId}
                  onSelectCategory={setActiveCategoryId}
                  filteredContacts={filteredContacts}
                  totalContacts={totalContacts}
                  usedThisMonth={usedThisMonth}
                  usedByCategory={usedByCategory}
                  onOpenSupportChat={openSupportChat}
                />
              </div>
            ) : null}

            {activeSection === 'recent' ? (
              <RecentActivitySection activity={activity} contactsById={contactsById} isLoading={isActivityLoading} />
            ) : null}

            {activeSection === 'stats' ? (
              <StatsSection folders={data?.folders ?? []} totalContacts={totalContacts} activity={activity} memberSince={user?.created_at ?? null} />
            ) : null}

            {activeSection === 'settings' ? (
              <SettingsSection
                email={user?.email ?? null}
                folders={data?.folders ?? []}
                accessHistory={data?.accessHistory ?? []}
                onSignOut={handleSignOut}
                onOpenSupportChat={openSupportChat}
              />
            ) : null}
          </div>
        </div>
      </main>

      <DashboardBottomTabs activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  );
}
