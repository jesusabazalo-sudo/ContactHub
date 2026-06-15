import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { officialCategories } from '../data/officialCategories';
import { useAuth } from '../features/auth/AuthProvider';
import { useAutofillProfile } from '../hooks/useAutofillProfile';
import { sanitizeEmail, sanitizePhone, sanitizeText, sanitizeTextInput } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type PublishForm = {
  fullName: string;
  email: string;
  whatsapp: string;
  businessName: string;
  offer: string;
  category: string;
  description: string;
  city: string;
  socialUrl: string;
  additionalMessage: string;
};

type ServiceSubmissionPayload = {
  user_id: string | null;
  full_name: string;
  email: string;
  whatsapp: string;
  business_name: string;
  offer: string;
  suggested_category: string;
  description: string;
  city: string;
  social_url: string;
  additional_message: string;
  status: string;
};

const initialForm: PublishForm = {
  fullName: '',
  email: '',
  whatsapp: '',
  businessName: '',
  offer: '',
  category: '',
  description: '',
  city: '',
  socialUrl: '',
  additionalMessage: '',
};

export default function PublishServicePage() {
  const { user } = useAuth();
  const autofill = useAutofillProfile();
  const [form, setForm] = useState<PublishForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: current.fullName || autofill.fullName || autofill.displayName,
      email: current.email || autofill.email,
      whatsapp: current.whatsapp || autofill.whatsapp || autofill.phone,
    }));
  }, [autofill.email, autofill.fullName, autofill.displayName, autofill.phone, autofill.whatsapp]);

  function update<K extends keyof PublishForm>(key: K, value: PublishForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openFallbackChat(payload: ServiceSubmissionPayload) {
    window.dispatchEvent(
      new CustomEvent('contacthub:open-chat', {
        detail: {
          message: [
            'Hola, quiero publicar mi servicio en ContactHub.',
            `Negocio: ${payload.business_name}`,
            `Contacto: ${payload.full_name || 'No indicado'}`,
            `Correo: ${payload.email || 'No indicado'}`,
            `WhatsApp: ${payload.whatsapp}`,
            `Qué ofrece: ${payload.offer}`,
            `Categoría: ${payload.suggested_category || 'No indicada'}`,
            `Ciudad: ${payload.city || 'No indicada'}`,
            `Descripción: ${payload.description}`,
          ].join('\n'),
        },
      }),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ServiceSubmissionPayload = {
      user_id: user?.id ?? null,
      full_name: sanitizeText(form.fullName, 160),
      email: sanitizeEmail(form.email),
      whatsapp: sanitizePhone(form.whatsapp),
      business_name: sanitizeText(form.businessName, 160),
      offer: sanitizeText(form.offer, 180),
      suggested_category: sanitizeText(form.category, 160),
      description: sanitizeText(form.description, 900),
      city: sanitizeText(form.city, 120),
      social_url: form.socialUrl.trim().slice(0, 500),
      additional_message: sanitizeText(form.additionalMessage, 500),
      status: 'pending_review',
    };

    if (!payload.business_name || !payload.whatsapp || !payload.offer || !payload.description) {
      toast.error('Completa negocio, WhatsApp, qué vendes y descripción.');
      return;
    }

    setIsSaving(true);
    try {
      if (!supabase || !isSupabaseConfigured) {
        openFallbackChat(payload);
        toast.info('Abrimos el chat para completar la revisión.');
        return;
      }

      const client = supabase as unknown as { from: (table: string) => any };
      const { error } = await client.from('service_submissions').insert(payload);
      if (error) {
        console.error('service_submissions insert:', error.message);
        openFallbackChat(payload);
        toast.info('La solicitud quedó preparada en soporte para revisión.');
        return;
      }

      setIsSent(true);
      toast.success('Solicitud enviada para revisión.');
    } catch (error) {
      console.error('PublishServicePage submit:', error);
      toast.error('No pudimos guardar la solicitud. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="section-pad section-band min-h-screen">
      <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="professional-kicker w-fit">Publica tu servicio</p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-white">Cuéntanos qué ofreces y lo revisamos.</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Postula tu negocio, servicio o recurso para aparecer en ContactHub. Puedes editar los datos autorrellenados antes de enviar.
          </p>
          <div className="mt-6 rounded-lg border border-brand-400/15 bg-brand-400/[0.05] p-5 text-sm leading-6 text-slate-300">
            <p className="font-bold text-white">Revisión antes de publicar</p>
            <p className="mt-2">Tu información no se publica automáticamente. Primero pasa por una revisión manual del equipo ContactHub.</p>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-400">
            {['Tus datos no se muestran sin revisión.', 'Puedes corregir la información antes de enviarla.', 'Usamos tus datos solo para gestionar la solicitud.'].map((item) => (
              <p key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {item}
              </p>
            ))}
          </div>
        </div>

        {isSent ? (
          <div className="professional-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-400" />
            <h2 className="mt-5 font-display text-2xl font-bold text-white">Solicitud recibida</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">La revisaremos antes de publicar cualquier información. Si necesitamos un dato adicional, te contactaremos.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="professional-card p-5 sm:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre de contacto">
                <input value={form.fullName} onChange={(event) => update('fullName', sanitizeTextInput(event.target.value, 160))} placeholder="Tu nombre" className="publish-input" />
              </Field>
              <Field label="Correo (opcional)">
                <input type="email" value={form.email} onChange={(event) => update('email', sanitizeEmail(event.target.value))} placeholder="tu@email.com" className="publish-input" />
              </Field>
              <Field label="Nombre del negocio *">
                <input required value={form.businessName} onChange={(event) => update('businessName', sanitizeTextInput(event.target.value, 160))} placeholder="Ej: Estudio Creativo Norte" className="publish-input" />
              </Field>
              <Field label="WhatsApp *">
                <input required value={form.whatsapp} onChange={(event) => update('whatsapp', sanitizePhone(event.target.value))} placeholder="+51 9..." className="publish-input font-mono" />
              </Field>
              <Field label="¿Qué vendes u ofreces? *">
                <input required value={form.offer} onChange={(event) => update('offer', sanitizeTextInput(event.target.value, 180))} placeholder="Ej: Diseño de marcas y contenido" className="publish-input" />
              </Field>
              <Field label="Categoría sugerida">
                <select value={form.category} onChange={(event) => update('category', event.target.value)} className="publish-input">
                  <option value="">Selecciona una categoría</option>
                  {officialCategories.map((category) => (
                    <option key={category.slug} value={`${category.title} — ${category.subtitle}`}>{category.icon} {String(category.sortOrder).padStart(2, '0')}. {category.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad (opcional)">
                <input value={form.city} onChange={(event) => update('city', sanitizeTextInput(event.target.value, 120))} placeholder="Ej: Lima" className="publish-input" />
              </Field>
              <Field label="Red social o web (opcional)">
                <input value={form.socialUrl} onChange={(event) => update('socialUrl', event.target.value.slice(0, 500))} placeholder="https://..." className="publish-input" />
              </Field>
            </div>

            <Field label="Descripción *" className="mt-4">
              <textarea required rows={4} value={form.description} onChange={(event) => update('description', sanitizeTextInput(event.target.value, 900))} placeholder="Explica qué ofreces, para quién sirve y cómo trabajas." className="publish-input min-h-28 py-3" />
            </Field>
            <Field label="Mensaje adicional (opcional)" className="mt-4">
              <textarea rows={3} value={form.additionalMessage} onChange={(event) => update('additionalMessage', sanitizeTextInput(event.target.value, 500))} placeholder="Algún detalle que debamos considerar durante la revisión." className="publish-input min-h-20 py-3" />
            </Field>

            <button type="submit" disabled={isSaving} className="focus-ring btn-primary-glow mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-60">
              <Send className="h-4 w-4" />
              {isSaving ? 'Enviando...' : 'Enviar para revisión'}
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: 'Hola, quiero ayuda para publicar mi servicio en ContactHub.' } }))} className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white/[0.03] px-5 text-sm font-bold text-white transition hover:border-brand-400/35">
              <MessageCircle className="h-4 w-4" />
              Pedir ayuda por chat
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}
