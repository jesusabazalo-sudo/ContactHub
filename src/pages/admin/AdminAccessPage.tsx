import { CheckCircle2, Clipboard, FolderCheck, RefreshCw, Search, UserRoundSearch, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { useAuth } from '../../features/auth/AuthProvider';
import { sanitizeEmail, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { formatDate } from '../../lib/format';
import {
  getUserAccessDiagnostics,
  reassignUnlinkedAccess,
  revokeCategoryAccess,
  revokeUnlinkedAccess,
  type AccessDiagnostic,
} from '../../services/accessService';
import {
  cancelPendingPurchase,
  getAdminCategories,
  getPendingPurchases,
  grantCategoryAccessesForUser,
  searchAdminUserByEmail,
  seedOfficialCategories,
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
  const [legacyCategoryByAccess, setLegacyCategoryByAccess] = useState<Record<string, string>>({});
  const [accessDiagnostics, setAccessDiagnostics] = useState<AccessDiagnostic[] | null>(null);
  const [isCheckingAccesses, setIsCheckingAccesses] = useState(false);
  const [isTotalConfirmOpen, setIsTotalConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);
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

  const availableCategoryIds = useMemo(
    () => categories.filter((category) => !activeCategoryIds.has(category.id)).map((category) => category.id),
    [activeCategoryIds, categories],
  );
  const canActivateAccess = Boolean(selectedUser?.id) && selectedCategoryIds.length > 0 && !isLoading && !isSearching && !isSubmitting;
  const allCategoriesSelected = availableCategoryIds.length > 0 && availableCategoryIds.every((categoryId) => selectedCategoryIds.includes(categoryId));

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
      if (!nextUser.id) {
        throw new Error('No se encontró un cliente registrado con ese correo.');
      }
      setSelectedUser(nextUser);
      setEmail(nextUser.email ?? emailToSearch);
      setSelectedCategoryIds([]);
      setLegacyCategoryByAccess({});
      setAccessDiagnostics(null);
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
    if (activeCategoryIds.has(categoryId)) return;
    setActivationResult(null);
    setActivationError(null);
    setSelectedCategoryIds((current) => {
      const nextCategoryIds = current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId];
      return nextCategoryIds;
    });
  }

  function handleTotalAccessSelection() {
    if (!selectedUser || !availableCategoryIds.length) return;
    if (allCategoriesSelected) {
      setSelectedCategoryIds([]);
      return;
    }
    setIsTotalConfirmOpen(true);
  }

  function confirmTotalAccessSelection() {
    setSelectedCategoryIds(availableCategoryIds);
    setIsTotalConfirmOpen(false);
    toast.success('Acceso total seleccionado.');
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
      const targetUserId = selectedUser.id;
      const targetEmail = selectedUser.email ?? sanitizeEmail(email);
      const requestedCategoryIds = [...selectedCategoryIds];
      const result = await grantCategoryAccessesForUser({
        targetUserId,
        targetUserEmail: targetEmail,
        categoryIds: requestedCategoryIds,
        adminUserId: user.id,
        notes: sanitizeText(notes, 500),
        source: selectedPending ? 'pending_request' : 'manual',
        pendingPurchaseId: selectedPending?.id,
      });
      if (result.userId !== targetUserId) {
        throw new Error('La verificación del acceso no coincide con el cliente seleccionado.');
      }
      if (import.meta.env.DEV) {
        console.debug('CONTACTHUB_DEBUG_ACCESS', {
          targetUserId,
          targetEmail,
          adminUserId: user.id,
          categoryIds: requestedCategoryIds,
          result,
        });
      }

      const refreshedUser = await searchAdminUserByEmail(targetEmail);
      const refreshedIds = new Set(refreshedUser.activeAccesses.map((access) => access.categoryId));
      if (
        refreshedUser.id !== targetUserId
        || requestedCategoryIds.some((categoryId) => !refreshedIds.has(categoryId))
      ) {
        console.error('AdminAccessPage post-grant refetch mismatch:', {
          targetUserId,
          targetEmail,
          requestedCategoryIds,
          refreshedUser,
        });
        throw new Error('No se pudo confirmar el acceso del cliente.');
      }

      setSelectedUser(refreshedUser);
      setActivationResult({
        email: result.email,
        categoryNames: result.categoryNames,
        message: result.message,
      });
      toast.success(`Acceso activado para ${targetEmail}.`);
      if (selectedPending?.id) {
        setPendingPurchases((current) => current.filter((purchase) => purchase.id !== selectedPending.id));
      }
      setSelectedPendingId(null);
      setNotes('');
      setSelectedCategoryIds([]);
    } catch (activationError) {
      const message = activationError instanceof Error ? activationError.message : 'No se pudo activar el acceso.';
      setActivationError(message);
      console.error('Error activando accesos:', activationError);
      if (import.meta.env.DEV) {
        console.debug('CONTACTHUB_DEBUG_ACCESS_FAILURE', {
          targetUserId: selectedUser.id,
          targetEmail: selectedUser.email,
          adminUserId: user.id,
          categoryIds: selectedCategoryIds,
          error: message,
        });
      }
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

  async function handleRevokeAccess(categoryId: string) {
    if (!user?.id || !selectedUser) {
      toast.error('No se encontró la sesión admin.');
      return;
    }

    const categoryName = selectedUser.activeAccesses.find((access) => access.categoryId === categoryId)?.categoryName ?? 'esta carpeta';
    const ok = window.confirm(`Vas a revocar el acceso a ${categoryName}. ¿Confirmas?`);
    if (!ok) return;

    try {
      const result = await revokeCategoryAccess({
        targetUserId: selectedUser.id,
        categoryId,
        revokedBy: user.id,
        note: `Acceso revocado desde Admin Accesos: ${categoryName}`,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'No se pudo revocar el acceso.');
        return;
      }
      toast.success('Acceso revocado.');
      const refreshedUser = await searchAdminUserByEmail(selectedUser.email ?? email);
      setSelectedUser(refreshedUser);
      setSelectedCategoryIds((current) => current.filter((id) => id !== categoryId));
    } catch (revokeError) {
      const message = revokeError instanceof Error ? revokeError.message : 'No se pudo revocar el acceso.';
      toast.error(message);
    }
  }

  async function handleReassignUnlinked(accessId: string) {
    if (!user?.id || !selectedUser?.id) {
      toast.error('No se encontró la sesión admin o el cliente destino.');
      return;
    }
    const categoryId = legacyCategoryByAccess[accessId];
    if (!categoryId) {
      toast.error('Selecciona una carpeta oficial para reasignar el acceso.');
      return;
    }
    const result = await reassignUnlinkedAccess({
      accessId,
      targetUserId: selectedUser.id,
      categoryId,
      grantedBy: user.id,
    });
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo reasignar el acceso.');
      return;
    }
    toast.success(`Acceso antiguo reasignado para ${selectedUser.email ?? 'el cliente'}.`);
    const refreshedUser = await searchAdminUserByEmail(selectedUser.email ?? email);
    setSelectedUser(refreshedUser);
    setLegacyCategoryByAccess((current) => {
      const next = { ...current };
      delete next[accessId];
      return next;
    });
  }

  async function handleRevokeUnlinked(accessId: string) {
    if (!user?.id || !selectedUser?.id) {
      toast.error('No se encontró la sesión admin o el cliente destino.');
      return;
    }
    const ok = window.confirm('Este acceso no está vinculado a una carpeta válida. ¿Deseas revocarlo?');
    if (!ok) return;
    const result = await revokeUnlinkedAccess({
      accessId,
      targetUserId: selectedUser.id,
      revokedBy: user.id,
    });
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo revocar el acceso antiguo.');
      return;
    }
    toast.success('Acceso antiguo revocado.');
    const refreshedUser = await searchAdminUserByEmail(selectedUser.email ?? email);
    setSelectedUser(refreshedUser);
  }

  async function handleVerifyRealAccesses() {
    if (!selectedUser?.id) return;
    setIsCheckingAccesses(true);
    try {
      const diagnostics = await getUserAccessDiagnostics(selectedUser.id);
      setAccessDiagnostics(diagnostics);
      toast.success(`${diagnostics.length} accesos activos confirmados en la tabla oficial.`);
    } catch (diagnosticError) {
      const message = diagnosticError instanceof Error ? diagnosticError.message : 'No se pudieron verificar los accesos reales.';
      setAccessDiagnostics(null);
      toast.error(message);
    } finally {
      setIsCheckingAccesses(false);
    }
  }

  async function handleSeedOfficialCategories() {
    setIsSeedingCategories(true);
    setActivationError(null);
    try {
      const result = await seedOfficialCategories();
      if (!result.ok) {
        const message = result.error ?? 'No se pudieron crear las carpetas oficiales.';
        setActivationError(message);
        toast.error(message);
        return;
      }
      toast.success(`Carpetas oficiales listas. ${result.created} creadas, ${result.updated} actualizadas.`);
      await loadAccessData();
    } catch (seedError) {
      const message = seedError instanceof Error ? seedError.message : 'No se pudieron crear las carpetas oficiales.';
      setActivationError(message);
      toast.error(message);
    } finally {
      setIsSeedingCategories(false);
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
                  <p className="mt-1 break-all text-[11px] text-brand-200">Destino verificado: {selectedUser.id}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-gray-400">
                <p>Teléfono: {selectedUser.phone ?? 'No registrado'}</p>
                <p>Carpetas activas: {selectedUser.activeAccesses.length}</p>
                <p>Prueba gratis: {selectedUser.usedTrial ? 'Usada' : 'No registrada'}</p>
                <p>Comprobantes: {selectedUser.receiptCount ?? 0} · Recompensas: {selectedUser.rewardCount ?? 0}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleVerifyRealAccesses()}
                disabled={isCheckingAccesses}
                className="focus-ring mt-4 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-2 text-xs font-bold text-brand-200 transition hover:bg-brand-400 hover:text-ink-950 disabled:opacity-60"
              >
                {isCheckingAccesses ? 'Verificando...' : 'Verificar accesos reales'}
              </button>
              {accessDiagnostics ? (
                <div className="mt-3 rounded-xl border border-line bg-ink-950/60 p-3">
                  <p className="text-xs font-semibold text-white">
                    Tabla oficial: user_category_access · user_id: {selectedUser.id}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {accessDiagnostics.length ? accessDiagnostics.map((access) => (
                      <div key={access.id} className="rounded-lg border border-line bg-white/[0.03] p-2 text-[11px] text-gray-400">
                        <p className="font-semibold text-brand-200">{access.categoryName}</p>
                        <p className="mt-1 break-all">
                          category_id: {access.categoryId ?? 'null'} · status: {access.status} · access_type: {access.accessType ?? 'manual'}
                        </p>
                        <p className="mt-1 break-all">granted_by: {access.grantedBy ?? 'sin registro'}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-gray-500">No hay accesos activos reales para este cliente.</p>
                    )}
                  </div>
                </div>
              ) : null}
              {selectedUser.activeAccesses.length ? (
                <div className="mt-4 grid gap-2">
                  {selectedUser.activeAccesses.map((access) => (
                    <div key={access.categoryId} className="flex flex-col gap-2 rounded-xl border border-brand-400/20 bg-brand-400/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-brand-200">{access.categoryName}</p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          {access.accessType ?? access.source ?? 'manual'} · {formatDate(access.updatedAt ?? access.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRevokeAccess(access.categoryId)}
                        className="focus-ring rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-100 transition hover:bg-red-400 hover:text-white"
                      >
                        Revocar
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {selectedUser.unlinkedAccesses.length ? (
                <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Accesos pendientes de vincular</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/70">
                    No cuentan como carpetas activas hasta que elijas una carpeta oficial.
                  </p>
                  <div className="mt-3 grid gap-3">
                    {selectedUser.unlinkedAccesses.map((access) => (
                      <div key={access.accessId} className="rounded-lg border border-amber-200/15 bg-ink-950/45 p-3">
                        <p className="break-all text-xs text-gray-400">
                          Vínculo: {access.categoryId ?? 'sin category_id'} · {formatDate(access.updatedAt ?? access.createdAt)}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <select
                            value={legacyCategoryByAccess[access.accessId] ?? ''}
                            onChange={(event) => setLegacyCategoryByAccess((current) => ({ ...current, [access.accessId]: event.target.value }))}
                            className="focus-ring h-10 rounded-lg border border-line bg-ink-950 px-3 text-xs text-white"
                          >
                            <option value="">Selecciona carpeta oficial</option>
                            {categories
                              .filter((category) => !activeCategoryIds.has(category.id))
                              .map((category) => (
                                <option key={category.id} value={category.id}>
                                  {String(category.sortOrder ?? 0).padStart(2, '0')}. {category.name}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleReassignUnlinked(access.accessId)}
                            className="focus-ring rounded-lg bg-brand-400 px-3 py-2 text-xs font-bold text-ink-950"
                          >
                            Reasignar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRevokeUnlinked(access.accessId)}
                            className="focus-ring rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100"
                          >
                            Revocar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-300">Categorías activas disponibles</p>
                  <p className="mt-1 text-xs text-gray-500">{selectedCategoryIds.length} seleccionadas</p>
                </div>
                {categories.length ? (
                  <button
                    type="button"
                    onClick={handleTotalAccessSelection}
                    className={`focus-ring rounded-full px-4 py-2 text-xs font-bold transition ${
                      allCategoriesSelected ? 'border border-line bg-white/5 text-white' : 'bg-brand-400 text-ink-950 hover:bg-white'
                    }`}
                  >
                    {allCategoriesSelected ? 'Deseleccionar todo' : 'Dar acceso total'}
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid max-h-[360px] gap-2 overflow-y-auto pr-1">
                {categories.length ? (
                  categories.map((category) => {
                    const alreadyActive = activeCategoryIds.has(category.id);
                    const checked = !alreadyActive && selectedCategoryIds.includes(category.id);

                    return (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                          alreadyActive
                            ? 'cursor-not-allowed border-brand-400/20 bg-brand-400/5 opacity-75'
                            : checked
                              ? 'cursor-pointer border-brand-400/45 bg-brand-400/10 hover:border-brand-400/50'
                              : 'cursor-pointer border-line bg-ink-950/50 hover:border-brand-400/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={alreadyActive}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 rounded border-line bg-ink-950 text-brand-400"
                        />
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-400/25 bg-brand-400/10 text-lg">
                          {category.icon ?? '📁'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 text-xs font-bold text-brand-200">
                              {String(category.sortOrder ?? 0).padStart(2, '0')}
                            </span>
                            <span className="block truncate text-sm font-semibold text-white">{category.name}</span>
                          </span>
                          {category.shortDescription ? <span className="block truncate text-xs text-gray-500">{category.shortDescription}</span> : null}
                          <span className="mt-1 block text-xs text-gray-500">{category.contactsCount} contactos · activo</span>
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
                    No se encontraron categorías activas. Ejecuta el seed de carpetas oficiales.
                  </p>
                )}
              </div>
              {!categories.length ? (
                <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
                  <p className="font-semibold text-white">No se encontraron categorías activas.</p>
                  <p className="mt-1 text-amber-100/80">Ejecuta el seed de carpetas oficiales para crear o reactivar las 24 carpetas de ContactHub.</p>
                  <button
                    type="button"
                    disabled={isSeedingCategories}
                    onClick={() => void handleSeedOfficialCategories()}
                    className="focus-ring mt-4 rounded-full bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950 disabled:opacity-60"
                  >
                    {isSeedingCategories ? 'Creando carpetas...' : 'Crear carpetas oficiales'}
                  </button>
                </div>
              ) : null}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Nota interna</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(sanitizeTextInput(event.target.value, 500))}
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
      {isTotalConfirmOpen && selectedUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-brand-400/30 bg-[#0f201f] p-6 shadow-2xl shadow-brand-400/10">
            <h3 className="text-xl font-bold text-white">Confirmar acceso total</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Se seleccionarán {availableCategoryIds.length} carpetas pendientes para{' '}
              <strong className="text-brand-200">{selectedUser.email ?? 'este cliente'}</strong>.
              El acceso se guardará para su ID de usuario, no para la cuenta admin.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTotalConfirmOpen(false)}
                className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmTotalAccessSelection}
                className="focus-ring rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950"
              >
                Seleccionar acceso total
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
