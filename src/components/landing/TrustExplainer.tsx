import { CheckCircle2, CreditCard, Eye, Headphones, KeyRound, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeading from '../ui/SectionHeading';

const trustItems = [
  { icon: Eye, label: 'Explora antes de registrarte' },
  { icon: KeyRound, label: 'Prueba gratuita disponible' },
  { icon: LockKeyhole, label: 'Accesos protegidos por cuenta' },
  { icon: CreditCard, label: 'Activación verificada' },
  { icon: Headphones, label: 'Soporte dentro de la plataforma' },
];

const transparency = [
  'Puedes conocer las categorías y su contenido general sin crear una cuenta.',
  'El correo funciona como llave para guardar pruebas, accesos y comprobantes.',
  'Los teléfonos completos solo aparecen cuando tienes permiso activo.',
  'Los pagos y recompensas pasan por una revisión antes de activar accesos.',
  'No pedimos contraseñas de Gmail, claves bancarias ni códigos privados.',
  'No vendemos tu información ni publicamos tus datos personales.',
];

export default function TrustExplainer() {
  return (
    <>
      <section className="border-b border-line bg-[#07100e]">
        <div className="container-shell grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((item) => (
            <div key={item.label} className="flex min-h-20 items-center gap-3 bg-[#07100e] px-4 py-4">
              <item.icon className="h-4 w-4 shrink-0 text-brand-400" />
              <span className="text-xs font-semibold leading-5 text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad bg-ink-950">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <div className="professional-kicker w-fit">
              <ShieldCheck className="h-4 w-4" />
              Transparencia
            </div>
            <SectionHeading
              title="Antes de registrarte, esto debes saber"
              description="Queremos que entiendas cómo funciona ContactHub y qué ocurre con tus datos antes de tomar una decisión."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/legal#privacidad" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:border-brand-400/35">
                Ver privacidad
              </Link>
              <Link to="/faq" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-bold text-brand-400 transition hover:bg-brand-400/[0.07]">
                Preguntas frecuentes →
              </Link>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {transparency.map((item, index) => (
              <div key={item} className="flex gap-3 bg-[#0a1512] p-5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div>
                  <span className="font-mono text-[11px] font-bold text-slate-600">0{index + 1}</span>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="container-shell mt-8">
          <div className="grid gap-3 rounded-lg border border-brand-400/15 bg-brand-400/[0.05] p-4 md:grid-cols-[auto_1fr] md:items-start">
            <MailCheck className="h-5 w-5 shrink-0 text-brand-400" />
            <div className="space-y-2 text-sm leading-6 text-slate-300">
              <p>
                <strong className="text-white">Tu correo es tu llave de acceso.</strong> Lo usamos para identificar tu cuenta y proteger lo que desbloqueas.
              </p>
              <p>
                ContactHub organiza información de contacto. No garantiza respuestas, ventas ni resultados específicos; te ayuda a ahorrar tiempo encontrando contactos organizados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
