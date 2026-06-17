import SectionHeading from '../components/ui/SectionHeading';

const terms = [
  'ContactHub organiza información de contacto y oportunidades, pero no garantiza respuestas, ventas ni resultados específicos.',
  'Los accesos se revisan y activan según comprobante, beneficio, recompensa o permiso manual.',
  'Los contactos pueden cambiar, dejar de responder o modificar sus condiciones sin aviso.',
  'El uso indebido, spam, fraude o intento de acceso no autorizado puede causar suspensión.',
  'The Vault y contenido restringido no se muestra a usuarios normales sin autorización.',
];

export default function TermsPage() {
  return (
    <section className="section-pad section-band">
      <div className="container-shell">
        <SectionHeading eyebrow="Términos" title="Reglas simples para usar ContactHub" description="Queremos que la plataforma sea útil, clara y responsable para usuarios, clientes y contactos." />
        <div className="mt-10 grid gap-3">
          {terms.map((term, index) => (
            <article key={term} className="grid gap-4 rounded-lg border border-line bg-panel p-5 sm:grid-cols-[auto_1fr]">
              <span className="font-mono text-sm font-bold text-brand-400">{String(index + 1).padStart(2, '0')}</span>
              <p className="text-sm leading-6 text-slate-300">{term}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
