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

type ChatReceipt = {
  id: string;
  user_id: string | null;
  message: string;
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
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

export default function AdminPaymentReceiptsPage() {
  const { user: adminUser } = useAuth();
  const [receipts, setReceipts] = useState<ChatReceipt[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ChatReceipt | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          .limit(200),
        supabase
          .from('categories')
          .select('id,name,icon,slug,sort_order,short_description')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (messagesRes.error) {
        console.error('AdminPaymentReceiptsPage chat_messages:', {
          message: messagesRes.error.message,
          details: messagesRes.error.details,
          code: messagesRes.error.code,
          hint: messagesRes.error.hint,
        });
        setReceipts([]);
        setError('No se pudieron cargar comprobantes. Ejecuta la migración 013_chat_receipts_24h.sql si aún no existe.');
        return;
      }

      if (categoriesRes.error) {
        console.error('AdminPaymentReceiptsPage categories:', categoriesRes.error.message);
      }

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
          user_email: profile?.email ?? 'Sin email',
          user_name: profile?.full_name ?? null,
          comprobante_status: row.comprobante_status ?? 'pendiente',
        };
      }));

      setReceipts(signedRows);
      setCategories(normalizeOfficialCategoryRows((categoriesRes.data ?? []) as AdminCategory[]) as AdminCategory[]);
    } catch (loadError) {
      console.error('AdminPaymentReceiptsPage catch:', loadError);
      setError('Error al cargar comprobantes. Revisa consola o configuración de Supabase.');
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
    toast.success('Comprobante actualizado.');
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
      message: 'Hola, revisamos tu comprobante pero no pudimos verificarlo.\n¿Puedes enviarnos una captura más clara del pago?\nEstamos para ayudarte. 🙏',
    });
  }

  async function activateAccess() {
    if (!selectedReceipt || !supabase || !isSupabaseConfigured) return;
    if (!selectedReceipt.user_id) {
      toast.error('Este comprobante no tiene usuario vinculado.');
      return;
    }
    if (!selectedCategoryIds.length) {
      toast.error('Elige al menos una carpeta para activar.');
      return;
    }
    const targetUserId = selectedReceipt.user_id;

    setIsUpdatingId(selectedReceipt.id);
    try {
      const accessRows = selectedCategoryIds.map((categoryId) => ({
        user_id: targetUserId,
        category_id: categoryId,
        granted_by: adminUser?.id ?? null,
        status: 'active' as const,
        updated_at: new Date().toISOString(),
      }));
      const { error: accessError } = await supabase.from('user_category_access').upsert(accessRows, { onConflict: 'user_id,category_id' });
      if (accessError) {
        console.error('AdminPaymentReceiptsPage activate:', accessError.message);
        toast.error(accessError.message);
        return;
      }

      const folderText = selectedCategoryNames.join(', ');
      await dynamicSupabase().from('chat_messages').update({ comprobante_status: 'verificado', read: true }).eq('id', selectedReceipt.id);
      await supabase.from('chat_messages').insert({
        user_id: selectedReceipt.user_id,
        session_id: selectedReceipt.user_id,
        sender: 'admin',
        read: false,
        message: `🎉 ¡Tu pago fue verificado! Te activamos acceso a ${folderText}.\nYa puedes ver todos los contactos. ¡Gracias por confiar en nosotros!`,
      });

      toast.success('✅ Comprobante aprobado y acceso activado.');
      setSelectedReceipt(null);
      setSelectedCategoryIds([]);
      await loadReceipts();
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

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Pagos</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">Comprobantes de pago</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Revisa imágenes enviadas desde el chat y activa manualmente las carpetas correctas.
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

        {error ? (
          <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50">
            <p className="font-semibold text-white">{error}</p>
            <button type="button" onClick={() => void loadReceipts()} className="mt-4 rounded-full bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950">
              Reintentar
            </button>
          </div>
        ) : null}

        {!error && receipts.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr className="border-b border-line">
                  <th className="py-3 pr-4">Usuario</th>
                  <th className="py-3 pr-4">Miniatura</th>
                  <th className="py-3 pr-4">Fecha y hora</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="align-top text-gray-300">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{receipt.user_email}</p>
                      <p className="mt-1 text-xs text-gray-500">{receipt.user_name ?? 'Sin nombre registrado'}</p>
                      <p className="mt-1 max-w-[220px] break-all text-[11px] text-gray-600">{receipt.user_id ?? 'Sin user_id'}</p>
                    </td>
                    <td className="py-4 pr-4">
                      {receipt.signedUrl ? (
                        <button type="button" onClick={() => window.open(receipt.signedUrl, '_blank', 'noopener,noreferrer')} className="group block">
                          <img src={receipt.signedUrl} alt="Comprobante" className="h-20 w-24 rounded-xl border border-line object-cover transition group-hover:border-brand-400/50" />
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-300">
                            <Eye className="h-3 w-3" />
                            Ver completa
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">Sin imagen disponible</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">{formatDate(receipt.created_at)}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(receipt.comprobante_status)}`}>
                        {statusLabel(receipt.comprobante_status)}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingId === receipt.id}
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setSelectedCategoryIds([]);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-ink-950 disabled:opacity-60"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Activar acceso
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingId === receipt.id}
                          onClick={() => void updateReceiptStatus(receipt, 'verificado')}
                          className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-bold text-brand-200 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marcar verificado
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!error && !receipts.length ? (
          <div className="mt-8 rounded-2xl border border-line bg-ink-950/60 p-8 text-center">
            <p className="font-display text-xl font-bold text-white">No hay comprobantes pendientes por revisar.</p>
            <p className="mt-2 text-sm text-gray-400">Cuando un cliente suba una imagen desde el chat, aparecerá aquí.</p>
          </div>
        ) : null}
      </section>

      {selectedReceipt ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-brand-400/25 bg-[#0F2027] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Activar acceso</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">{selectedReceipt.user_email}</h3>
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
                      <span className="mt-1 h-4 w-4 rounded border border-brand-400/50 bg-ink-950 text-center text-[10px] text-brand-300">{selected ? '✓' : ''}</span>
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
                ✅ Activar accesos seleccionados
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
