import { CheckCircle2, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { formatDate } from '../../lib/format';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ReceiptStatus = 'pending_review' | 'approved' | 'rejected' | 'access_granted' | 'reviewed';

type PaymentReceipt = {
  id: string;
  user_id: string | null;
  email: string | null;
  plan_id: string | null;
  plan_name: string | null;
  category_name: string | null;
  file_url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  status: ReceiptStatus;
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function dynamicSupabase() {
  return supabase as unknown as {
    from: (table: string) => any;
  };
}

function statusLabel(status: ReceiptStatus) {
  const labels: Record<ReceiptStatus, string> = {
    pending_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    access_granted: 'Acceso activado',
    reviewed: 'Revisado',
  };
  return labels[status] ?? status;
}

export default function AdminPaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReceipts() {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setReceipts([]);
        setError('Falta conectar Supabase.');
        return;
      }
      const { data, error: receiptsError } = await dynamicSupabase()
        .from('payment_receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (receiptsError) {
        console.error('AdminPaymentReceiptsPage:', receiptsError.message);
        setReceipts([]);
        setError(`${receiptsError.message}. Si la tabla aún no existe, ejecuta la migración 009_payment_receipts.sql.`);
        return;
      }
      setReceipts((data ?? []) as unknown as PaymentReceipt[]);
    } catch (loadError) {
      console.error('AdminPaymentReceiptsPage load:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar comprobantes.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, []);

  async function updateStatus(id: string, status: ReceiptStatus) {
    if (!supabase || !isSupabaseConfigured) return;
    const { error: updateError } = await dynamicSupabase()
      .from('payment_receipts')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) {
      console.error('AdminPaymentReceiptsPage update:', updateError.message);
      toast.error(updateError.message);
      return;
    }
    if (status === 'access_granted') toast.success('✅ Acceso activado correctamente.');
    else toast.success('Comprobante actualizado.');
    await loadReceipts();
  }

  if (isLoading) return <LoadingState title="Cargando comprobantes" message="Leyendo solicitudes de pago." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadReceipts} />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Pagos</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">Comprobantes de pago</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Revisa comprobantes enviados desde el chat y marca el estado antes de activar accesos manualmente.
            </p>
          </div>
          <button type="button" onClick={() => void loadReceipts()} className="focus-ring inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-white hover:border-brand-400/40">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr className="border-b border-line">
                <th className="py-3 pr-4">Usuario</th>
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
                    <p className="font-semibold text-white">{receipt.email ?? 'Usuario sin email'}</p>
                    <p className="mt-1 text-xs text-gray-500">{receipt.user_id ?? 'Sin user_id'}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-white">{receipt.plan_name ?? receipt.plan_id ?? 'Sin plan'}</p>
                    <p className="mt-1 text-xs text-gray-500">{receipt.category_name ?? 'Sin carpeta específica'}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="max-w-[220px] break-all text-xs text-gray-400">{receipt.file_name ?? receipt.file_path ?? 'Sin archivo'}</p>
                    {receipt.file_url ? (
                      <a href={receipt.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-300 hover:text-brand-200">
                        Ver comprobante
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4">{formatDate(receipt.created_at)}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-200">
                      {statusLabel(receipt.status)}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void updateStatus(receipt.id, 'approved')} className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-bold text-brand-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aprobar
                      </button>
                      <button type="button" onClick={() => void updateStatus(receipt.id, 'rejected')} className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200">
                        <XCircle className="h-3.5 w-3.5" />
                        Rechazar
                      </button>
                      <button type="button" onClick={() => void updateStatus(receipt.id, 'access_granted')} className="rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-ink-950">
                        Activar acceso
                      </button>
                      <button type="button" onClick={() => void updateStatus(receipt.id, 'reviewed')} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-gray-300">
                        Revisado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!receipts.length ? <p className="mt-8 rounded-2xl border border-line bg-ink-950/60 p-6 text-center text-sm text-gray-400">Todavía no hay comprobantes enviados.</p> : null}
      </section>
    </AdminShell>
  );
}
