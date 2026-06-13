import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../features/auth/AuthProvider';
import { useAutofillProfile } from '../hooks/useAutofillProfile';
import { sanitizeEmail, sanitizePhone, sanitizeText, sanitizeTextInput } from '../lib/sanitize';

type PublishForm = {
  fullName: string;
  email: string;
  whatsapp: string;
  serviceName: string;
  category: string;
  description: string;
};

const initialForm: PublishForm = {
  fullName: '',
  email: '',
  whatsapp: '',
  serviceName: '',
  category: '',
  description: '',
};

export default function PublishServicePage() {
  const { user } = useAuth();
  const autofill = useAutofillProfile();
  const [form, setForm] = useState<PublishForm>(initialForm);

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeForm = {
      fullName: sanitizeText(form.fullName, 160),
      email: sanitizeEmail(form.email),
      whatsapp: sanitizePhone(form.whatsapp),
      serviceName: sanitizeText(form.serviceName, 160),
      category: sanitizeText(form.category, 120),
      description: sanitizeText(form.description, 700),
    };

    if (!safeForm.email || !safeForm.serviceName || !safeForm.description) {
      toast.error('Completa correo, nombre del servicio y descripción.');
      return;
    }

    window.dispatchEvent(
      new CustomEvent('contacthub:open-chat', {
        detail: {
          message: [
            'Hola, quiero publicar mi servicio en ContactHub.',
            `Nombre: ${safeForm.fullName || 'No indicado'}`,
            `Correo: ${safeForm.email}`,
            `WhatsApp: ${safeForm.whatsapp || 'No indicado'}`,
            `Servicio: ${safeForm.serviceName}`,
            `Categoría sugerida: ${safeForm.category || 'No indicada'}`,
            `Descripción: ${safeForm.description}`,
          ].join('\n'),
        },
      }),
    );
    toast.success('Solicitud preparada en el chat.');
  }

  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">Publica tu servicio</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white">Cuéntanos qué ofreces y lo revisamos.</h1>
          <p className="mt-4 text-base leading-7 text-gray-300">
            Si ya iniciaste sesión, rellenamos tus datos básicos para que no tengas que escribirlos otra vez. Puedes editarlos antes de enviar.
          </p>
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-5 text-sm leading-6 text-gray-200">
            <p className="font-bold text-white">Privacidad simple</p>
            <p className="mt-2">
              Usamos estos datos solo para gestionar tu cuenta, accesos, comprobantes y soporte. No se muestran públicamente sin revisión.
            </p>
          </div>
          {!user ? (
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Puedes preparar tu solicitud sin iniciar sesión. Para guardar accesos o comprobantes sí necesitaremos una cuenta.
            </p>
          ) : null}
        </div>

        <form onSubmit={submit} className="dopamine-card neon-edge rounded-3xl p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Nombre</span>
              <input
                value={form.fullName}
                onChange={(event) => update('fullName', sanitizeTextInput(event.target.value, 160))}
                placeholder="Tu nombre"
                className="focus-ring h-12 rounded-2xl border border-line bg-ink-950/70 px-4 text-[16px] text-white placeholder:text-gray-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Correo</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => update('email', sanitizeEmail(event.target.value))}
                placeholder="tu@email.com"
                className="focus-ring h-12 rounded-2xl border border-line bg-ink-950/70 px-4 text-[16px] text-white placeholder:text-gray-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">WhatsApp</span>
              <input
                value={form.whatsapp}
                onChange={(event) => update('whatsapp', sanitizePhone(event.target.value))}
                placeholder="+51 9..."
                className="focus-ring h-12 rounded-2xl border border-line bg-ink-950/70 px-4 font-mono text-[16px] text-white placeholder:text-gray-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Categoría sugerida</span>
              <input
                value={form.category}
                onChange={(event) => update('category', sanitizeTextInput(event.target.value, 120))}
                placeholder="Ej: Educación, marketing, oficios..."
                className="focus-ring h-12 rounded-2xl border border-line bg-ink-950/70 px-4 text-[16px] text-white placeholder:text-gray-500"
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-white">Nombre del servicio</span>
            <input
              required
              value={form.serviceName}
              onChange={(event) => update('serviceName', sanitizeTextInput(event.target.value, 160))}
              placeholder="Ej: Clases de inglés, proveedor de polos, diseño de logos..."
              className="focus-ring h-12 rounded-2xl border border-line bg-ink-950/70 px-4 text-[16px] text-white placeholder:text-gray-500"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-white">Descripción</span>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(event) => update('description', sanitizeTextInput(event.target.value, 700))}
              placeholder="Cuéntanos qué ofreces, para quién sirve y cómo deberían contactarte."
              className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-[16px] leading-6 text-white placeholder:text-gray-500"
            />
            <span className="text-right text-xs text-gray-500">{form.description.length}/700</span>
          </label>

          <button
            type="submit"
            className="focus-ring btn-primary-glow mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-400 px-5 py-3 text-sm font-black text-ink-950 transition hover:bg-white"
          >
            <Send className="h-4 w-4" />
            Enviar solicitud
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: 'Hola, quiero ayuda para publicar mi servicio en ContactHub.' } }))}
            className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-400/35"
          >
            <MessageCircle className="h-4 w-4" />
            Pedir ayuda por chat
          </button>
        </form>
      </div>
    </section>
  );
}
