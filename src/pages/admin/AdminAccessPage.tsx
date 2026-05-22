import { CheckCircle2, Clipboard, FolderCheck, RefreshCw, Search, UserRoundSearch, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { useAuth } from '../../features/auth/AuthProvider';
import { sanitizeEmail, sanitizeText } from '../../lib/sanitize';
import { formatDate } from '../../lib/format';
import {
  cancelPendingPurchase,
  getAdminCategories,
  getPendingPurchases,
  grantCategoryAccessesByEmail,
  searchAdminUserByEmail,
  type AdminCategory,
  type AdminFoundUser,
  type PendingPurchase,
} from '../../services/adminService';

type ActivationResult = {
  email: string | null;
  categoryNames: string[];
  message: string;
};

export default function AdminAccessPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminFoundUser | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);

  const selectedPending = useMemo(
    () => pendingPurchases.find((purchase) => purchase.id === selectedPendingId) ?? null,
    [pendingPurchases, selectedPendingId],
  );

  const activeCategoryIds = useMemo(
    () => new Set(selectedUser?.activeAccesses.map((access) => access.categoryId) ?? []),
    [selectedUser],
  );

  const canActivateAccess = Boolean(selectedUser) && selectedCategoryIds.length > 0 && !isLoading && !isSearching && !isSubmitting;

  async function loadAccessData() {
    setIsLoading(true);
    setError(null);
    try {
      const [nextCategories, nextPending] = await Promise.all([getAdminCategories(), getPendingPurchases()]);
      setCategories(nextCategories);
      setPendingPurchases(nextPending);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar la gestión de accesos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccessData();
  }, []);

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(sanitizeEmail(emailFromUrl));
      void handleSearchUser(emailFromUrl);
    }
  }, [searchParams]);

  async function handleSearchUser(emailOverride?: string) {
    const emailToSearch = sanitizeEmail(emailOverride ?? email);

    setIsSearching(true);
    setSearchError(null);
    setSelectedUser(null);
    setActivationResult(null);
    setActivationError(null);

    try {
      const nextUser = await searchAdminUserByEmail(emailToSearch);
      setSelectedUser(nextUser);
      setEmail(nextUser.email ?? emailToSearch);
      toast.success('Usuario encontrado.');
    } catch (searchFailure) {
      const message = searchFailure instanceof Error ? searchFailure.message : 'No se pudo buscar el usuario.';
      setSearchError(message);
      console.error('Error buscando usuario para activar accesos:', searchFailure);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSearchUser();
  }

  function toggleCategory(categoryId: string) {
    setActivationResult(null);
    setActivationError(null);
    setSelectedCategoryIds((current) => {
      const nextCategoryIds = current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId];
      return nextCategoryIds;
    });
  }

  function usePendingPurchase(purchase: PendingPurchase) {
    setSelectedPendingId(purchase.id);
    setEmail(sanitizeEmail(purchase.userEmail ?? ''));
    setSelectedCategoryIds(purchase.categoryId ? [purchase.categoryId] : []);
    setNotes(`Activado desde solicitud pendiente ${purchase.id.slice(0, 8)}.`);
    setActivationResult(null);

    if (purchase.userEmail) {
      void handleSearchUser(purchase.userEmail);
    } else {
      setSelectedUser(null);
      setSearchError('La solicitud no tiene email asociado. Busca al usuario manualmente.');
    }
  }

  async function handleGrantAccess() {

    if (!user?.id) {
      toast.error('No se encontró la sesión admin.');
      return;
    }

    if (!selectedUser) {
      const message = 'Busca y confirma el usuario antes de activar accesos.';
      setSearchError(message);
      setActivationError(message);
      return;
    }

    if (!selectedCategoryIds.length) {
      const message = 'Selecciona al menos una categoría para activar.';
      setActivationError(message);
      return;
    }

    setIsSubmitting(true);
    setActivationResult(null);
    setActivationError(null);

    try {
      const emailForGrant = selectedUser.email ?? sanitizeEmail(email);
      const result = await grantCategoryAccessesByEmail({
        email: emailForGrant,
        categoryIds: selectedCategoryIds,
        adminUserId: user.id,
        notes: sanitizeText(notes, 500),
        source: selectedPending ? 'pending_request' : 'manual',
        pendingPurchaseId: selectedPending?.id,
      });
      console.log('CONTACTHUB_DEBUG_ACCESS', {
        selectedUser,
        selectedCategory: selectedCategoryIds,
        result,
        error: null,
      });

      setActivationResult({
        email: result.email,
        categoryNames: result.categoryNames,
        message: result.message,
      });
      toast.success('🎉 ¡Acceso desbloqueado! Tu nueva carpeta ya está disponible.');
      setSelectedPendingId(null);
      setNotes('');
      setSelectedCategoryIds([]);
      await loadAccessData();
      const refreshedUser = await searchAdminUserByEmail(emailForGrant);
      setSelectedUser(refreshedUser);
    } catch (activationError) {
      const message = activationError instanceof Error ? activationError.message : 'No se pudo activar el acceso.';
      setActivationError(message);
      console.error('Error activando accesos:', activationError);
      console.log('CONTACTHUB_DEBUG_ACCESS', {
        selectedUser,
        selectedCategory: selectedCategoryIds,
        result: null,
        error: message,
      });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelPending(purchaseId: string) {
    if (!user?.id) {
      toast.error('No se encontró la sesión admin.');
      return;
    }

    try {
      await cancelPendingPurchase({ purchaseId, adminUserId: user.id });
      toast.success('Solicitud cancelada.');
      await loadAccessData();
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la solicitud.';
      toast.error(message);
    }
  }

  async function copyActivationMessage() {
    if (!activationResult) return;

    try {
      await navigator.clipboard.writeText(activationResult.message);
      toast.success('Mensaje copiado para WhatsApp.');
    } catch {
      toast.error('No se pudo copiar el mensaje.');
    }
  }

  if (isLoading) {
    return <LoadingState title="Cargando accesos" message="Estamos trayendo categorías y solicitudes pendientes." />;
  }

  if (error) {
    return <FriendlyErrorState message={error} onRetry={loadAccessData} />;
  }

  return (
    <AdminShell>
      <AdminNotice />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center gap-2">
            <FolderCheck className="h-5 w-5 text-brand-400" />
            <h2 className="font-display text-2xl font-bold text-white">Activar accesos</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Busca un usuario registrado y otorga una o varias carpetas. La activación queda guardada en Supabase.
          </p>

          {selectedPending ? (
            <div className="mt-5 rounded-lg border border-brand-400/25 bg-brand-400/10 p-4 text-sm leading-6 text-gray-200">
              Atendiendo solicitud pendiente de {selectedPending.userEmail ?? 'usuario sin email'}.
            </div>
          ) : null}

          <form onSubmit={handleSearchSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Email del cliente</span>
              <input
                required
                value={email}
                onChange={(event) => {
                  setEmail(sanitizeEmail(event.target.value));
                  setSelectedUser(null);
                  setActivationResult(null);
                  setSearchError(null);
                  setActivationError(null);
                }}
                type="email"
                placeholder="cliente@email.com"
                className="focus-ring h-12 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white placeholder:text-gray-500"
              />
            </label>
            <button
              type="submit"
              disabled={isSearching}
              className="focus-ring mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-5 text-sm font-bold text-white transition hover:border-brand-400/35 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {searchError ? (
            <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              {searchError}
            </div>
          ) : null}

          {selectedUser ? (
            <div className="mt-5 rounded-2xl border border-line bg-ink-950/50 p-5">
              <div className="flex items-start gap-3">
                <UserRoundSearch className="mt-1 h-5 w-5 text-brand-400" />
                <div>
                  <p className="font-semibold text-white">{selectedUser.email ?? 'Usuario sin email'}</p>
                  <p className="mt-1 text-sm text-gray-400">{selectedUser.fullName ?? 'Sin nombre registrado'}</p>
                  <p className="mt-1 text-xs text-gray-500">Registrado: {formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-gray-400">
                <p>Teléfono: {selectedUser.phone ?? 'No registrado'}</p>
                <p>Carpetas activas: {selectedUser.activeAccesses.length}</p>
              </div>
              {selectedUser.activeAccesses.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedUser.activeAccesses.map((access) => (
                    <span key={access.categoryId} className="rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-200">
                      {access.categoryName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-300">Categorías activas disponibles</p>
                <p className="text-xs text-gray-500">{selectedCategoryIds.length} seleccionadas</p>
              </div>

              <div className="mt-3 grid max-h-[360px] gap-2 overflow-y-auto pr-1">
                {categories.length ? (
                  categories.map((category) => {
                    const checked = selectedCategoryIds.includes(category.id);
                    const alreadyActive = activeCategoryIds.has(category.id);

                    return (
                      <label
                        key={category.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-ink-950/50 p-3 transition hover:border-brand-400/35"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 rounded border-line bg-ink-950 text-brand-400"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{category.name}</span>
                          <span className="block text-xs text-gray-500">{category.contactsCount} contactos</span>
                        </span>
                        {alreadyActive ? (
                          <span className="rounded-full border border-brand-400/25 px-2 py-1 text-xs font-semibold text-brand-200">
                            Ya activo
                          </span>
                        ) : null}
                      </label>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-line bg-ink-950/50 p-5 text-sm leading-6 text-gray-400">
                    No hay categorías activas disponibles en Supabase.
                  </p>
                )}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Nota interna</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(sanitizeText(event.target.value, 500))}
                rows={3}
                placeholder="Pago confirmado por WhatsApp/Yape."
                className="focus-ring resize-none rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-sm text-white placeholder:text-gray-500"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleGrantAccess()}
              disabled={!canActivateAccess}
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Activando...' : 'Activar accesos seleccionados'}
            </button>
          </div>

          {activationError ? (
            <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              {activationError}
            </div>
          ) : null}

          {activationResult ? (
            <div className="mt-6 rounded-2xl border border-brand-400/25 bg-brand-400/10 p-5">
              <p className="font-semibold text-white">Acceso activado para {activationResult.email ?? 'cliente'}.</p>
              <p className="mt-2 text-sm text-brand-200">{activationResult.categoryNames.join(', ')}</p>
              <div className="mt-4 rounded-lg border border-brand-400/25 bg-brand-400/10 p-4 text-sm font-semibold text-brand-100">
                ✅ Permiso activado. Ya puedes explorar tu nuevo acceso.
              </div>
              <div className="mt-4 rounded-lg border border-line bg-ink-950/70 p-4 text-sm leading-6 text-gray-300">{activationResult.message}</div>
              <button
                type="button"
                onClick={copyActivationMessage}
                className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-brand-400/35"
              >
                <Clipboard className="h-4 w-4" />
                Copiar mensaje para WhatsApp
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Solicitudes pendientes</h2>
              <p className="mt-2 text-sm text-gray-400">Solicitudes creadas con estado pending en Supabase.</p>
            </div>
            <button
              type="button"
              onClick={loadAccessData}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-brand-400/35"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {pendingPurchases.length ? (
              pendingPurchases.map((purchase) => (
                <article key={purchase.id} className="rounded-lg border border-line bg-ink-950/50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-white">{purchase.userEmail ?? 'Usuario sin email'}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(purchase.createdAt)}</p>
                      <p className="mt-3 text-sm leading-6 text-gray-400">
                        Plan: {purchase.planName ?? 'Sin plan'} · Carpeta: {purchase.categoryName ?? 'Por elegir'}
                      </p>
                      {purchase.notes ? <p className="mt-2 text-xs text-gray-500">{purchase.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => usePendingPurchase(purchase)}
                        className="focus-ring inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Usar solicitud
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancelPending(purchase.id)}
                        className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-amber-300/35"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-ink-950/50 p-5 text-sm leading-6 text-gray-400">
                No hay solicitudes pendientes en este momento.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
