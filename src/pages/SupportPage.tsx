import { Link } from 'react-router-dom';
import SectionHeading from '../components/ui/SectionHeading';
import { APP_CONFIG } from '../config/app';
import { faqs } from '../data/faq';
import { buildWhatsAppLink } from '../lib/whatsapp';

function openChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function SupportPage() {
  const whatsappUrl = buildWhatsAppLink(APP_CONFIG.whatsappNumber, 'Hola, vengo desde ContactHub. Necesito ayuda con una consulta sobre carpetas, pagos o acceso.');
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading eyebrow="Soporte" title="Soporte ContactHub" description="Resuelve dudas sobre pagos, comprobantes, accesos, prueba gratis, publicaciones y contactos desbloqueados." />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button type="button" onClick={() => openChat('Hola, necesito ayuda para pagar en ContactHub.')} className="focus-ring rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white">Cómo pagar</button>
          <button type="button" onClick={() => openChat('Hola, ya pagué y quiero enviar mi comprobante.')} className="focus-ring rounded-lg border border-brand-400/25 bg-brand-400/10 px-4 py-3 text-sm font-bold text-brand-100">Enviar comprobante</button>
          <Link to="/mis-contactos" className="focus-ring rounded-lg border border-line bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white">Ver mis contactos</Link>
          {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="focus-ring rounded-lg border border-line bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white">Soporte por WhatsApp</a> : null}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqs.slice(0, 8).map((faq) => (
            <article key={faq.question} className="professional-card p-5">
              <h2 className="font-semibold text-white">{faq.question}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
