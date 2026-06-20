import PromoSection from '../components/landing/PromoSection';
import PricingCard from '../components/pricing/PricingCard';
import SectionHeading from '../components/ui/SectionHeading';
import { pricingPlans } from '../data/pricing';
import { Link } from 'react-router-dom';

function openSupport(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function PricingPage() {
  return (
    <>
      <section className="section-pad section-band">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Opciones de acceso"
            title="Accesos claros para necesidades distintas"
            description="Explora primero y elige después. Cada opción indica cuántas carpetas incluye y el acceso se activa tras una verificación."
          />
          <div className="mt-6 rounded-lg border border-brand-400/15 bg-brand-400/[0.05] p-5 text-sm leading-6 text-content-secondary">
            <p className="font-bold text-content">Proceso transparente</p>
            <p className="mt-2">
              Los pagos se revisan manualmente. ContactHub no pide claves bancarias, codigos privados ni contrasenas externas. Si tienes dudas, abre el chat y pide orientacion antes de enviar un comprobante.
            </p>
            <p className="mt-2 font-semibold text-brand-text">
              Paga solo si ya tienes claro qué carpeta o acceso quieres. Si tienes dudas, usa el chat antes.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-brand-400/20 bg-surface p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-content">Antes de pagar, revisa esto</h2>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-content-secondary md:grid-cols-2">
                  {[
                    'Paga solo si ya sabes qué carpeta o acceso quieres.',
                    'Si tienes dudas, usa el chat de soporte antes de pagar.',
                    'Nunca pedimos claves bancarias, códigos privados ni contraseñas.',
                    'El comprobante se revisa manualmente y el acceso queda guardado en tu cuenta.',
                  ].map((item) => (
                    <p key={item} className="rounded-lg border border-border bg-muted p-3">{item}</p>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
                <button type="button" onClick={() => openSupport('Hola, quiero consultar antes de pagar en ContactHub.')} className="focus-ring rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-content transition hover:bg-brand-400">
                  Consultar antes de pagar
                </button>
                <Link to="/catalogo" className="focus-ring rounded-lg border border-border bg-muted px-4 py-3 text-center text-sm font-bold text-content transition hover:border-brand-400/35">
                  Ver catálogo
                </Link>
                <button type="button" onClick={() => openSupport('Hola, ya pagué y quiero enviar mi comprobante para activar mi acceso.')} className="focus-ring rounded-lg border border-brand-400/30 bg-brand-400/10 px-4 py-3 text-sm font-bold text-brand-text transition hover:bg-brand-400/20">
                  Enviar comprobante
                </button>
                <button type="button" onClick={() => openSupport('Hola, necesito ayuda de Soporte ContactHub.')} className="focus-ring rounded-lg border border-border bg-muted px-4 py-3 text-sm font-bold text-content transition hover:border-brand-400/35">
                  Hablar con soporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PromoSection />
    </>
  );
}
