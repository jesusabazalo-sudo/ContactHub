import { CheckCircle2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import LegalLayout, { LegalIdentity } from '../components/legal/LegalLayout';
import { LEGAL } from '../config/app';
import { useAuth } from '../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { sanitizeText } from '../lib/sanitize';

function generarCodigo() {
  const d = new Date();
  const fecha = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RC-${fecha}-${rand}`;
}

const inputClass = 'publish-input';
const labelClass = 'text-sm font-semibold text-content';

export default function ReclamacionesPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  const [form, setForm] = useState({
    tipo: 'reclamo',
    consumidor_nombre: '',
    doc_tipo: 'DNI',
    doc_numero: '',
    domicilio: '',
    telefono: '',
    email: user?.email ?? '',
    es_menor: false,
    bien_tipo: 'servicio',
    bien_descripcion: '',
    monto_reclamado: '',
    detalle: '',
    pedido: '',
    consent: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.consumidor_nombre || !form.doc_numero || !form.email || !form.detalle || !form.pedido) {
      toast.error('Completa los campos obligatorios (*).');
      return;
    }
    if (!form.consent) {
      toast.error('Debes aceptar la declaración para registrar tu reclamación.');
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      toast.error(`No pudimos conectar. Envía tu reclamación a ${LEGAL.email}.`);
      return;
    }

    const nuevoCodigo = generarCodigo();
    setSaving(true);
    try {
      const db = supabase as unknown as {
        from: (table: string) => { insert: (values: Record<string, unknown>) => Promise<{ error: { message?: string } | null }> };
      };
      const { error } = await db.from('reclamaciones').insert({
        codigo: nuevoCodigo,
        tipo: form.tipo,
        consumidor_nombre: sanitizeText(form.consumidor_nombre, 160),
        doc_tipo: form.doc_tipo,
        doc_numero: sanitizeText(form.doc_numero, 30),
        domicilio: sanitizeText(form.domicilio, 200) || null,
        telefono: sanitizeText(form.telefono, 30) || null,
        email: sanitizeText(form.email, 160),
        es_menor: form.es_menor,
        bien_tipo: form.bien_tipo,
        bien_descripcion: sanitizeText(form.bien_descripcion, 300) || null,
        monto_reclamado: form.monto_reclamado ? Number(form.monto_reclamado) : null,
        detalle: sanitizeText(form.detalle, 1500),
        pedido: sanitizeText(form.pedido, 1000),
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setCodigo(nuevoCodigo);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('reclamaciones insert:', err);
      toast.error(`No se pudo registrar. Escríbenos a ${LEGAL.email} con tu reclamación.`);
    } finally {
      setSaving(false);
    }
  }

  if (codigo) {
    return (
      <LegalLayout eyebrow="INDECOPI" title="Libro de Reclamaciones">
        <div className="rounded-xl border border-brand/30 bg-brand/[0.06] p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-brand-text" />
          <h2 className="mt-4 font-display text-xl font-bold text-content">Tu reclamación fue registrada</h2>
          <p className="mt-3 text-sm leading-6 text-content-secondary">
            Guarda tu código de seguimiento:
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-brand-text">{codigo}</p>
          <p className="mt-4 text-sm leading-6 text-content-secondary">
            Daremos respuesta en un plazo máximo de <strong className="text-content">15 días hábiles</strong>, conforme a la
            normativa de INDECOPI, al correo que registraste.
          </p>
        </div>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      eyebrow="INDECOPI"
      title="Libro de Reclamaciones"
      intro="Conforme al Código de Protección y Defensa del Consumidor, ponemos a tu disposición este Libro de Reclamaciones. Completa el formulario y recibirás un código de seguimiento."
    >
      <LegalIdentity />

      <form onSubmit={submit} className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        {/* Tipo */}
        <fieldset className="space-y-2">
          <legend className={labelClass}>Tipo de solicitud *</legend>
          <div className="flex flex-wrap gap-3">
            {[['reclamo', 'Reclamo (disconformidad con el servicio)'], ['queja', 'Queja (malestar con la atención)']].map(([value, label]) => (
              <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${form.tipo === value ? 'border-brand/50 bg-brand/[0.08] text-content' : 'border-border text-content-secondary'}`}>
                <input type="radio" name="tipo" checked={form.tipo === value} onChange={() => set('tipo', value)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Consumidor */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={labelClass}>Nombre completo *</span>
            <input className={inputClass} value={form.consumidor_nombre} onChange={(e) => set('consumidor_nombre', e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Correo electrónico *</span>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Tipo de documento *</span>
            <select className={inputClass} value={form.doc_tipo} onChange={(e) => set('doc_tipo', e.target.value)}>
              <option>DNI</option><option>Carné de extranjería</option><option>Pasaporte</option><option>RUC</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Número de documento *</span>
            <input className={inputClass} value={form.doc_numero} onChange={(e) => set('doc_numero', e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Teléfono</span>
            <input className={inputClass} value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Domicilio</span>
            <input className={inputClass} value={form.domicilio} onChange={(e) => set('domicilio', e.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-content-secondary">
          <input type="checkbox" checked={form.es_menor} onChange={(e) => set('es_menor', e.target.checked)} />
          Soy menor de edad (la reclamación la presenta mi padre/madre o apoderado)
        </label>

        {/* Bien contratado */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={labelClass}>Identificación del bien</span>
            <select className={inputClass} value={form.bien_tipo} onChange={(e) => set('bien_tipo', e.target.value)}>
              <option value="servicio">Servicio</option><option value="producto">Producto</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Monto reclamado (S/)</span>
            <input type="number" step="0.01" min="0" className={inputClass} value={form.monto_reclamado} onChange={(e) => set('monto_reclamado', e.target.value)} />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className={labelClass}>Descripción del servicio/producto</span>
            <input className={inputClass} value={form.bien_descripcion} onChange={(e) => set('bien_descripcion', e.target.value)} placeholder="Ej. Acceso a carpeta X, plan Starter…" />
          </label>
        </div>

        {/* Detalle */}
        <label className="grid gap-1.5">
          <span className={labelClass}>Detalle del reclamo o queja *</span>
          <textarea rows={4} className={`${inputClass} py-2`} value={form.detalle} onChange={(e) => set('detalle', e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Pedido del consumidor *</span>
          <textarea rows={3} className={`${inputClass} py-2`} value={form.pedido} onChange={(e) => set('pedido', e.target.value)} placeholder="¿Qué solución esperas?" />
        </label>

        <label className="flex items-start gap-2 text-xs leading-5 text-content-secondary">
          <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
          Declaro que la información proporcionada es verídica y autorizo su tratamiento para atender esta reclamación,
          conforme a la Política de Privacidad.
        </label>

        <button
          type="submit"
          disabled={saving}
          className="focus-ring inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Enviando…' : 'Registrar reclamación'}
        </button>
        <p className="text-xs leading-5 text-content-muted">
          Recibirás un código de seguimiento y una respuesta en un máximo de 15 días hábiles (INDECOPI).
        </p>
      </form>
    </LegalLayout>
  );
}
