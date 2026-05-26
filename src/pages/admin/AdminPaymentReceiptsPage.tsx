import { CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatCurrency, formatDate } from '../../lib/format';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ReceiptStatus = 'pending_review' | 'approved' | 'rejected' | 'access_granted';

type PaymentReceipt = {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  payment_method: string;
  amount: number | null;
  plan_key: string | null;
  plan_label: string | null;
  folder_id: string | null;
  folder_label: string | null;
  receipt_file_url: string | null;
  receipt_file_path: string | null;
  receipt_file_name: string | null;
  receipt_mime_type: string | null;
  status: ReceiptStatus;
  customer_message: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
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

function statusLabel(status: ReceiptStatus) {
  const labels: Record<ReceiptStatus, string> = {
    pending_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    access_granted: 'Acceso activado',
  };
  return labels[status] ?? status;
}

function statusClass(status: ReceiptStatus) {
  if (status === 'access_granted') return 'border-brand-400/30 bg-brand-400/10 text-brand-200';
  if (status === 'approved') return 'border-blue-300/30 bg-blue-300/10 text-blue-100';
  if (status === 'rejected') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';
  return error?.code === 'PGRST205' || message.includes('schema cache') || message.includes('payment_receipts');
}

export default function AdminPaymentReceiptsPage() {
  const { user: adminUser } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedCategoryByReceipt, setSelectedCategoryByReceipt] = useState<Record<string, string>>({});
  const [notesByReceipt, setNotesByReceipt] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  async function loadReceipts() {
    setIsLoading(true);
    setError(null);
    setTechnicalError(null);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setReceipts([]);
        setCategories([]);
        setError('Falta conectar Supabase.');
        return;
      }

      const [receiptsRes, categoriesRes] = await Promise.all([
        dynamicSupabase()
          .from('payment_receipts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('categories')
          .select('id,name,icon,slug,sort_order,short_description')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (receiptsRes.error) {
        console.error('AdminPaymentReceiptsPage load:', {
          message: receiptsRes.error.message,
          details: receiptsRes.error.details,
          code: receiptsRes.error.code,
          hint: receiptsRes.error.hint,
        });
        setReceipts([]);
        setError(
          isMissingTableError(receiptsRes.error)
            ? 'No existe la tabla payment_receipts. Ejecuta la migración 009_payment_receipts.sql.'
            : 'Error al cargar comprobantes. Revisa consola o configuración de Supabase.',
        );
        setTechnicalError([receiptsRes.error.code, receiptsRes.error.message, receiptsRes.error.details, receiptsRes.error.hint].filter(Boolean).join(' · '));
        return;
      }

      if (categoriesRes.error) {
        console.error('AdminPaymentReceiptsPage categories:', categoriesRes.error.message);
      }

      const nextReceipts = (receiptsRes.data ?? []) as PaymentReceipt[];
      setReceipts(nextReceipts);
      setCategories(normalizeOfficialCategoryRows((categoriesRes.data ?? []) as AdminCategory[]) as AdminCategory[]);
      setSelectedCategoryByReceipt((current) => {
        const next = { ...current };
        nextReceipts.forEach((receipt) => {
          if (!next[receipt.id] && receipt.folder_id) next[receipt.id] = receipt.folder_id;
        });
        return next;
      });
    } catch (loadError) {
      console.error('AdminPaymentReceiptsPage catch:', loadError);
      setReceipts([]);
      setError('Error al cargar comprobantes. Revisa consola o configuración de Supabase.');
      setTechnicalError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, []);

  async function patchReceipt(id: string, updates: Record<string, unknown>, successMessage: string) {
    if (!supabase || !isSupabaseConfigured) return false;
    setIsUpdatingId(id);
    const { error: updateError } = await dynamicSupabase()
      .from('payment_receipts')
      .update({
        ...updates,
        reviewed_by: adminUser?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    setIsUpdatingId(null);

    if (updateError) {
      console.error('AdminPaymentReceiptsPage update:', {
        message: updateError.message,
        details: updateError.details,
        code: updateError.code,
        hint: updateError.hint,
      });
      toast.error(updateError.message ?? 'No se pudo actualizar el comprobante.');
      return false;
    }

    toast.success(successMessage);
    await loadReceipts();
    return true;
  }

  async function updateStatus(receipt: PaymentReceipt, status: ReceiptStatus) {
    await patchReceipt(receipt.id, { status, admin_note: notesByReceipt[receipt.id] ?? receipt.admin_note }, 'Comprobante actualizado.');
  }

  async function markReviewed(receipt: PaymentReceipt) {
    await patchReceipt(receipt.id, { admin_note: notesByReceipt[receipt.id] ?? receipt.admin_note }, 'Comprobante marcado como revisado.');
  }

  async function openReceipt(receipt: PaymentReceipt) {
    if (receipt.receipt_file_path && supabase && isSupabaseConfigured) {
      const { data, error: signedError } = await dynamicSupabase()
        .storage
        .from('payment-receipts')
        .createSignedUrl(receipt.receipt_file_path, 60 * 60);

      if (signedError) {
        console.error('AdminPaymentReceiptsPage signed url:', signedError.message);
        toast.error('No se pudo abrir el comprobante. Revisa permisos del bucket.');
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    if (receipt.receipt_file_url) {
      window.open(receipt.receipt_file_url, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.error('Este comprobante no tiene archivo asociado.');
  }

  async function activateAccess(receipt: PaymentReceipt) {
    if (!supabase || !isSupabaseConfigured) return;
    if (!receipt.user_id) {
      toast.error('Este comprobante no tiene usuario vinculado. Pide al cliente iniciar sesión y reenviar el comprobante.');
      return;
    }

    const targetUserId = receipt.user_id;
    const selectedCategoryId = selectedCategoryByReceipt[receipt.id] || receipt.folder_id;
    const isTotalAccess = receipt.plan_key === 'elite-total' || (receipt.plan_label ?? '').toLowerCase().includes('elite total') || (receipt.plan_label ?? '').toLowerCase().includes('acceso total');
    const categoryIds = isTotalAccess ? categories.map((category) => category.id) : selectedCategoryId ? [selectedCategoryId] : [];

    if (!categoryIds.length) {
      toast.error('Elige una carpeta para activar este comprobante.');
      return;
    }

    setIsUpdatingId(receipt.id);
    try {
      const accessRows = categoryIds.map((categoryId) => ({
        user_id: targetUserId,
        category_id: categoryId,
        granted_by: adminUser?.id ?? null,
        status: 'active' as const,
        updated_at: new Date().toISOString(),
      }));

      const { error: accessError } = await supabase.from('user_category_access').upsert(accessRows, { onConflict: 'user_id,category_id' });
      if (accessError) {
        console.error('AdminPaymentReceiptsPage activate access:', accessError.message);
        toast.error(accessError.message);
        return;
      }

      await supabase.from('audit_logs').insert({
        actor_id: adminUser?.id ?? null,
        action: 'payment_receipt_access_granted',
        target_type: 'payment_receipts',
        target_id: receipt.id,
        metadata: {
          receipt_id: receipt.id,
          user_id: receipt.user_id,
          user_email: receipt.user_email,
          category_ids: categoryIds,
          plan_key: receipt.plan_key,
        },
      });

      const selectedCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null;
      const note = notesByReceipt[receipt.id] ?? receipt.admin_note ?? null;
      const { error: receiptError } = await dynamicSupabase()
        .from('payment_receipts')
        .update({
          status: 'access_granted',
          folder_id: selectedCategoryId ?? receipt.folder_id,
          folder_label: selectedCategory?.name ?? receipt.folder_label,
          admin_note: note,
          reviewed_by: adminUser?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      if (receiptError) {
        console.error('AdminPaymentReceiptsPage update after access:', receiptError.message);
        toast.error(receiptError.message);
        return;
      }

      toast.success('✅ Comprobante aprobado y acceso activado.');
      await loadReceipts();
    } finally {
      setIsUpdatingId(null);
    }
  }

  if (isLoading) return <LoadingState title="Cargando comprobantes" message="Leyendo solicitudes de pago." />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Pagos</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">Comprobantes de pago</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Revisa comprobantes enviados desde el chat, abre el archivo y activa el acceso cuando corresponda.
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
            {technicalError ? <p className="mt-2 break-all text-xs text-amber-100/75">{technicalError}</p> : null}
            <button type="button" onClick={() => void loadReceipts()} className="mt-4 rounded-full bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950">
              Reintentar
            </button>
          </div>
        ) : null}

        {!error && receipts.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr className="border-b border-line">
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Pago</th>
                  <th className="py-3 pr-4">Plan / carpeta</th>
                  <th className="py-3 pr-4">Archivo</th>
                  <th className="py-3 pr-4">Fecha</th>
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
                      <p className="font-semibold capitalize text-white">{receipt.payment_method || 'yape'}</p>
                      <p className="mt-1 text-xs text-gray-500">{receipt.amount ? formatCurrency(receipt.amount) : 'Monto no indicado'}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{receipt.plan_label ?? receipt.plan_key ?? 'Sin plan'}</p>
                      <p className="mt-1 text-xs text-gray-500">{receipt.folder_label ?? 'Sin carpeta específica'}</p>
                      <select
                        value={selectedCategoryByReceipt[receipt.id] ?? receipt.folder_id ?? ''}
                        onChange={(event) => setSelectedCategoryByReceipt((current) => ({ ...current, [receipt.id]: event.target.value }))}
                        className="focus-ring mt-3 w-full max-w-[260px] rounded-xl border border-line bg-ink-950 px-3 py-2 text-xs text-white"
                      >
                        <option value="">Elegir carpeta para activar</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.displayLabel}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="max-w-[220px] break-all text-xs text-gray-400">{receipt.receipt_file_name ?? receipt.receipt_file_path ?? 'Sin archivo'}</p>
                      <button
                        type="button"
                        onClick={() => void openReceipt(receipt)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-300 hover:text-brand-200"
                      >
                        Ver comprobante
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <p>{formatDate(receipt.created_at)}</p>
                      {receipt.reviewed_at ? <p className="mt-1 text-xs text-gray-500">Revisado: {formatDate(receipt.reviewed_at)}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(receipt.status)}`}>
                        {statusLabel(receipt.status)}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="grid gap-2">
                        <textarea
                          value={notesByReceipt[receipt.id] ?? receipt.admin_note ?? ''}
                          onChange={(event) => setNotesByReceipt((current) => ({ ...current, [receipt.id]: event.target.value }))}
                          rows={2}
                          placeholder="Nota admin"
                          className="focus-ring w-full min-w-[240px] resize-none rounded-xl border border-line bg-ink-950/70 px-3 py-2 text-xs text-white placeholder:text-gray-500"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isUpdatingId === receipt.id}
                            onClick={() => void updateStatus(receipt, 'approved')}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-bold text-brand-200 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingId === receipt.id}
                            onClick={() => void updateStatus(receipt, 'rejected')}
                            className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 disabled:opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingId === receipt.id}
                            onClick={() => void activateAccess(receipt)}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-ink-950 disabled:opacity-60"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Activar acceso
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingId === receipt.id}
                            onClick={() => void markReviewed(receipt)}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-gray-300 disabled:opacity-60"
                          >
                            Marcar revisado
                          </button>
                        </div>
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
            <p className="mt-2 text-sm text-gray-400">Cuando un cliente suba su comprobante desde el chat, aparecerá aquí.</p>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
