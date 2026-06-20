import SectionHeading from '../components/ui/SectionHeading';
import { faqs } from '../data/faq';

export default function FAQPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <SectionHeading eyebrow="FAQ" title="Preguntas frecuentes" />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-semibold text-content">{faq.question}</h2>
              <p className="mt-2 text-sm leading-6 text-content-secondary">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
