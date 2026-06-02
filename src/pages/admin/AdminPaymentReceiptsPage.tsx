import { CheckCircle2, Eye, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatDate } from '../../lib/format';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ReceiptStatus = 'pendiente' | 'verificado' | 'rechazado';
type ReceiptFilter = 'all' | ReceiptStatus;

type ChatReceipt = {
  id: string;
  user_id: string | null;
  message: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  comprobante_status: ReceiptStatus | null;
  created_at: string;
  signedUrl?: string;
  user_email?: string;
  user_name?: string | null;
};

type AdminCategory = {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
  slug?: string | null;
  short_description?: string | null;
} & OfficialCategoryDisplay;

function dynamicSupabase() {
  return supabase as unknown as {
    from: (table: string) => any;
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      };
    };
  };
}

function statusLabel(status: ReceiptStatus | null | undefined) {
  if (status === 'verificado') return 'Verificado';
  if (status === 'rechazado') return 'Rechazado';
  return 'Pendiente';
}

function statusClass(status: ReceiptStatus | null | undefined) {
  if (status === 'verificado') return 'border-brand-400/30 bg-brand-400/10 text-brand-200';
  if (status === 'rechazado') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-red-400/30 bg-red-400/10 text-red-100';
}

function normalizeStatus(status: ReceiptStatus | null | undefined): ReceiptStatus {
  return status ?? 'pendiente';
}

export default function AdminPaymentReceiptsPage() {
  const { user: adminUser } = useAuth();
  const [receipts, setReceipts] = useState<ChatReceipt[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ChatReceipt | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReceiptFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: receipts.length,
    pendiente: receipts.filter((receipt) => normalizeStatus(receipt.comprobante_status) === 'pendiente').length,
    verificado: receipts.filter((receipt) => normalizeStatus(receipt.comprobante_status) === 'verificado').length,
    rechazado: receipts.filter((receipt) => normalizeStatus(receipt.comprobante_status) === 'rechazado').length,
  }), [receipts]);

  const filteredReceipts = useMemo(() => (
    statusFilter === 'all' ? receipts : receipts.filter((receipt) => normalizeStatus(receipt.comprobante_status) === statusFilter)
  ), [receipts, statusFilter]);

  const selectedCategoryNames = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)).map((category) => category.displayLabel),
    [categories, selectedCategoryIds],
  );

  async function loadReceipts() {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setReceipts([]);
        setCategories([]);
        setError('Falta conectar Supabase.');
        return;
      }

      const [messagesRes, categoriesRes] = await Promise.all([
        dynamicSupabase()
          .from('chat_messages')
          .select('id,user_id,message,attachment_url,attachment_type,comprobante_status,created_at')
          .eq('has_attachment', true)
          .order('created_at', { ascending: false })
          .limit(250),
        supabase
          .from('categories')
          .select('id,name,icon,slug,sort_order,short_description')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (messagesRes.error) {
        console.error('AdminPaymentReceiptsPage chat_messages:', messagesRes.error);
        setReceipts([]);
        setError('No se pudieron cargar comprobantes. Ejecuta la migracion 013_chat_receipts_24h.sql si aun no existe.');
        return;
      }
      if (categoriesRes.error) console.error('AdminPaymentReceiptsPage categories:', categoriesRes.error.message);

      const rows = (messagesRes.data ?? []) as ChatReceipt[];
      const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))] as string[];
      const profilesRes = userIds.length
        ? await supabase.from('profiles').select('id,email,full_name').in('id', userIds)
        : { data: [], error: null };
      if (profilesRes.error) console.error('AdminPaymentReceiptsPage profiles:', profilesRes.error.message);

      const profiles = new Map((profilesRes.data ?? []).map((profile: { id: string; email: string | null; full_name: string | null }) => [profile.id, profile]));
      const signedRows = await Promise.all(rows.map(async (row) => {
        let signedUrl = row.attachment_url ?? '';
        if (row.attachment_url && !row.attachment_url.startsWith('http') && !row.attachment_url.startsWith('blob:')) {
          const signed = await dynamicSupabase().storage.from('comprobantes').createSignedUrl(row.attachment_url, 60 * 60);
          if (signed.error) console.error('AdminPaymentReceiptsPage signed url:', signed.error.message);
          signedUrl = signed.data?.signedUrl ?? '';
        }
        const profile = row.user_id ? profiles.get(row.user_id) : null;
        return {
          ...row,
          signedUrl,
          user_email: profile?.email ?? 'Usuario desconocido',
          user_name: profile?.full_name ?? null,
          comprobante_status: normalizeStatus(row.comprobante_status),
        };
      }));

      setReceipts(signedRows);
      setCategories(normalizeOfficialCategoryRows((categoriesRes.data ?? []) as AdminCategory[]) as AdminCategory[]);
    } catch (loadError) {
      console.error('AdminPaymentReceiptsPage catch:', loadError);
      setError('Error al cargar comprobantes. Revisa consola o configuracion de Supabase.');
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, []);

  async function updateReceiptStatus(receipt: ChatReceipt, status: ReceiptStatus) {
    if (!supabase || !isSupabaseConfigured) return false;
    setIsUpdatingId(receipt.id);
    const { error: updateError } = await dynamicSupabase()
      .from('chat_messages')
      .update({ comprobante_status: status, read: true })
      .eq('id', receipt.id);
    setIsUpdatingId(null);
    if (updateError) {
      console.error('AdminPaymentReceiptsPage status:', updateError.message);
      toast.error(updateError.message);
      return false;
    }
    await loadReceipts();
    return true;
  }

  async function rejectReceipt(receipt: ChatReceipt) {
    if (!receipt.user_id || !supabase || !isSupabaseConfigured) return;
    const ok = await updateReceiptStatus(receipt, 'rechazado');
    if (!ok) return;
    await supabase.from('chat_messages').insert({
      user_id: receipt.user_id,
      session_id: receipt.user_id,
      sender: 'admin',
      read: false,
      message: 'Revisamos tu comprobante pero no pudimos verificarlo.\n\nPuedes enviarnos una captura mas clara del pago con monto y numero visible.\n\nEstamos aqui para ayudarte.',
    });
    toast.success('Comprobante rechazado y usuario notificado.');
  }

  async function activateAccess() {
    if (!selectedReceipt || !supabase || !isSupabaseConfigured) return;
    if (!selectedReceipt.user_id) {
      toast.error('Este comprobante no tiene usuario vinculado.');
      return;
    }
    const targetUserId = selectedReceipt.user_id;
    if (!selectedCategoryIds.length) {
      toast.error('Elige al menos una carpeta para activar.');
      return;
    }

    setIsUpdatingId(selectedReceipt.id);
    try {
      const rows = selectedCategoryIds.map((categoryId) => ({
        user_id: targetUserId,
        category_id: categoryId,
        granted_by: adminUser?.id ?? null,
        status: 'active' as const,
        updated_at: new Date().toISOString(),
      }));
      const { error: accessError } = await supabase.from('user_category_access').upsert(rows, { onConflict: 'user_id,category_id' });
      if (accessError) {
        console.error('AdminPaymentReceiptsPage activate:', accessError.message);
        toast.error(accessError.message);
        return;
      }

      await dynamicSupabase().from('chat_messages').update({ comprobante_status: 'verificado', read: true }).eq('id', selectedReceipt.id);
      await supabase.from('chat_messages').insert({
        user_id: selectedReceipt.user_id,
        session_id: selectedReceipt.user_id,
        sender: 'admin',
        read: false,
        message: `Tu pago fue verificado.\n\nYa tienes acceso a: ${selectedCategoryNames.join(', ')}.\n\nPuedes ver todos los contactos ahora mismo. Gracias por confiar en ContactHub.`,
      });

      toast.success('Comprobante aprobado y acceso activado.');
      setSelectedReceipt(null);
      setSelectedCategoryIds([]);
      await loadReceipts();
    } catch (activationError) {
      console.error('AdminPaymentReceiptsPage activate catch:', activationError);
      toast.error('Error al activar. Intenta de nuevo.');
    } finally {
      setIsUpdatingId(null);
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => (
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]
    ));
  }

  if (isLoading) return <LoadingState title="Cargando comprobantes" message="Leyendo adjuntos enviados por chat." />;

  const tabs: Array<{ id: ReceiptFilter; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'pendiente', label: 'Pendientes', count: counts.pendiente },
    { id: 'verificado', label: 'Verificados', count: counts.verificado },
    { id: 'rechazado', label: 'Rechazados', count: counts.rechazado },
  ];

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Pagos</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">Comprobantes de pago</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Revisa los pagos recibidos y activa el acceso del cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadReceipts()}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-white hover:border-brand-400/40"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                statusFilter === tab.id ? 'border-brand-400/50 bg-brand-400 text-ink-950' : 'border-line bg-white/5 text-gray-300 hover:border-brand-400/40'
              }`}
            >
              {tab.label}
              {tab.count ? <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5">{tab.count}</span> : null}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50">
            <p className="font-semibold text-white">{error}</p>
            <button type="button" onClick={() => void loadReceipts()} className="mt-4 rounded-full bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950">
              Reintentar
            </button>
          </div>
        ) : null}

        {!error && filteredReceipts.length ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredReceipts.map((receipt) => (
              <article
                key={receipt.id}
                className={`flex flex-col gap-4 rounded-2xl border bg-white/[0.03] p-4 sm:flex-row ${
                  normalizeStatus(receipt.comprobante_status) === 'pendiente'
                    ? 'border-red-400/30'
                    : normalizeStatus(receipt.comprobante_status) === 'verificado'
                      ? 'border-brand-400/30'
                      : 'border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => receipt.signedUrl && window.open(receipt.signedUrl, '_blank', 'noopener,noreferrer')}
                  className="group mx-auto h-28 w-28 flex-none overflow-hidden rounded-2xl border-2 border-purple-400/60 bg-ink-950 sm:mx-0"
                >
                  {receipt.signedUrl ? (
                    <img src={receipt.signedUrl} alt="Comprobante" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-500">Sin imagen</span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="break-all text-sm font-bold text-white">{receipt.user_email}</p>
                      <p className="mt-1 text-xs text-gray-500">{receipt.user_name ?? 'Sin nombre registrado'}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(receipt.created_at)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(receipt.comprobante_status)}`}>
                      {statusLabel(receipt.comprobante_status)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-400">{receipt.message ?? 'Comprobante enviado desde chat.'}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {receipt.signedUrl ? (
                      <button
                        type="button"
                        onClick={() => window.open(receipt.signedUrl, '_blank', 'noopener,noreferrer')}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition hover:border-brand-400/40"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver comprobante
                      </button>
                    ) : null}
                    {normalizeStatus(receipt.comprobante_status) === 'pendiente' ? (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingId === receipt.id}
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setSelectedCategoryIds([]);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 disabled:opacity-60"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Activar acceso
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingId === receipt.id}
                          onClick={() => void rejectReceipt(receipt)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      </>
                    ) : null}
                    {normalizeStatus(receipt.comprobante_status) !== 'pendiente' ? (
                      <button
                        type="button"
                        disabled={isUpdatingId === receipt.id}
                        onClick={() => void updateReceiptStatus(receipt, 'pendiente')}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 disabled:opacity-60"
                      >
                        Reabrir revision
                      </button>
                    ) : null}
                    {normalizeStatus(receipt.comprobante_status) === 'pendiente' ? (
                      <button
                        type="button"
                        disabled={isUpdatingId === receipt.id}
                        onClick={() => void updateReceiptStatus(receipt, 'verificado')}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-bold text-brand-200 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marcar revisado
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!error && !filteredReceipts.length ? (
          <div className="mt-8 rounded-2xl border border-line bg-ink-950/60 p-8 text-center">
            <p className="font-display text-xl font-bold text-white">No hay comprobantes pendientes por revisar.</p>
            <p className="mt-2 text-sm text-gray-400">Cuando un cliente suba una imagen desde el chat, aparecera aqui.</p>
          </div>
        ) : null}
      </section>

      {selectedReceipt ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-brand-400/25 bg-[#0F2027] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Activar acceso</p>
                <h3 className="mt-2 break-all font-display text-2xl font-bold text-white">{selectedReceipt.user_email}</h3>
                <p className="mt-2 text-sm text-gray-400">Selecciona una o varias carpetas para activar por este comprobante.</p>
              </div>
              <button type="button" onClick={() => setSelectedReceipt(null)} className="rounded-full border border-line px-3 py-1.5 text-sm font-bold text-white">Cerrar</button>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-300">{selectedCategoryIds.length} carpetas seleccionadas</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {categories.map((category) => {
                const selected = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-brand-400/60 bg-brand-400/12' : 'border-line bg-white/[0.03] hover:border-brand-400/35'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded border border-brand-400/50 bg-ink-950 text-center text-[10px] text-brand-300">{selected ? 'OK' : ''}</span>
                      <div>
                        <p className="font-semibold text-white">{category.displayLabel}</p>
                        <p className="mt-1 text-xs text-gray-500">{category.short_description ?? 'Carpeta oficial ContactHub'}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setSelectedReceipt(null)} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-white">Cancelar</button>
              <button
                type="button"
                disabled={!selectedCategoryIds.length || isUpdatingId === selectedReceipt.id}
                onClick={() => void activateAccess()}
                className="rounded-full bg-brand-400 px-5 py-2 text-sm font-black text-ink-950 disabled:opacity-50"
              >
                Confirmar y activar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
