import { CheckCircle2, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const beforeRegister = [
  'Puedes explorar el catalogo sin registrarte.',
  'El correo solo se usa para guardar tus accesos.',
  'Los pagos se revisan manualmente antes de activar carpetas.',
  'Los telefonos completos solo se muestran con acceso activo.',
  'No vendemos tu correo ni lo publicamos.',
  'Puedes escribir por soporte si tienes dudas antes de pagar.',
];

const steps = [
  { title: 'Explora', text: 'Revisa categorias, descripciones y telefonos protegidos antes de crear cuenta.' },
  { title: 'Elige', text: 'Selecciona una carpeta, pack, prueba gratis o mision segun lo que buscas lograr.' },
  { title: 'Verificamos', text: 'Si pagas, subes tu comprobante y el acceso se activa despues de revision manual.' },
  { title: 'Accedes', text: 'Cuando tu permiso esta activo, ves los telefonos completos de tus carpetas.' },
];

const receives = [
  'Acceso a carpetas organizadas por tema y objetivo.',
  'Contactos con telefono completo solo cuando corresponde.',
  'Historial de accesos asociado a tu cuenta.',
  'Soporte por chat para dudas, pagos y comprobantes.',
];

const notReceives = [
  'No pedimos claves bancarias, codigos privados ni contrasenas de Gmail.',
  'No prometemos resultados economicos ni ventas garantizadas.',
  'No publicamos tu correo ni tus comprobantes.',
];

export default function TrustExplainer() {
  return (
    <section id="como-funciona" className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <article className="rounded-2xl border border-brand-400/20 bg-[#0d1d19]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-200">
              <ShieldCheck className="h-4 w-4" />
              Antes de registrarte
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white">
              Esto debes saber sobre ContactHub
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              ContactHub es una plataforma para explorar contactos y oportunidades organizadas. La cuenta sirve para guardar accesos, pruebas y comprobantes. Puedes mirar primero y decidir con calma.
            </p>
            <div className="mt-5 grid gap-3">
              {beforeRegister.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3 text-sm leading-5 text-gray-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/catalogo" className="focus-ring inline-flex justify-center rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white">
                Explorar catalogo
              </Link>
              <Link to="/faq" className="focus-ring inline-flex justify-center rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-400/40">
                Ver preguntas frecuentes
              </Link>
            </div>
          </article>

          <div className="grid gap-5">
            <article className="rounded-2xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-brand-400" />
                <h3 className="font-display text-2xl font-bold text-white">Como funciona</h3>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div key={step.title} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                    <span className="text-xs font-bold text-brand-300">0{index + 1}</span>
                    <p className="mt-2 font-bold text-white">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{step.text}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-line bg-panel p-6">
                <h3 className="font-display text-xl font-bold text-white">Que recibes realmente</h3>
                <div className="mt-4 grid gap-3">
                  {receives.map((item) => (
                    <p key={item} className="text-sm leading-6 text-gray-300">- {item}</p>
                  ))}
                </div>
              </article>
              <article className="rounded-2xl border border-line bg-panel p-6">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-brand-400" />
                  <h3 className="font-display text-xl font-bold text-white">Uso responsable</h3>
                </div>
                <div className="mt-4 grid gap-3">
                  {notReceives.map((item) => (
                    <p key={item} className="text-sm leading-6 text-gray-300">- {item}</p>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
