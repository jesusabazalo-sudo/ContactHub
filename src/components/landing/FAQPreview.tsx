import { Link } from 'react-router-dom';
import { faqs } from '../../data/faq';
import SectionHeading from '../ui/SectionHeading';

export default function FAQPreview() {
  return (
    <section className="section-pad bg-ink-900">
      <div className="container-shell">
        <SectionHeading align="center" eyebrow="Preguntas" title="Lo básico, claro y sin vueltas" />
        <div className="mx-auto mt-10 grid max-w-4xl gap-3">
          {faqs.slice(0, 5).map((faq) => (
            <article key={faq.question} className="rounded-lg border border-line bg-panel p-5">
              <h3 className="font-semibold text-white">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{faq.answer}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/faq" className="text-sm font-bold text-brand-400 transition hover:text-white">
            Ver todas las preguntas
          </Link>
        </div>
      </div>
    </section>
  );
}
