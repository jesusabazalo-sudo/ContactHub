import { BookOpen, Bot, BriefcaseBusiness, GraduationCap, PackageSearch, Palette, Wrench } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const useCases = [
  { icon: PackageSearch, title: 'Quiero encontrar proveedores', text: 'Explora opciones comerciales y servicios para una necesidad concreta.' },
  { icon: GraduationCap, title: 'Quiero aprender algo', text: 'Ubica recursos, clases y personas relacionadas con formación.' },
  { icon: BriefcaseBusiness, title: 'Quiero vender por internet', text: 'Encuentra herramientas y contactos para mover tu negocio.' },
  { icon: Bot, title: 'Quiero herramientas de IA', text: 'Revisa automatización, productividad y recursos tecnológicos.' },
  { icon: BookOpen, title: 'Quiero cursos y libros', text: 'Explora opciones educativas antes de desbloquear información.' },
  { icon: Palette, title: 'Quiero crear contenido', text: 'Diseño, edición, audio y recursos para proyectos creativos.' },
  { icon: Wrench, title: 'Quiero contactos para servicios', text: 'Encuentra oficios y soluciones prácticas organizadas por área.' },
];

export default function Benefits() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Casos de uso"
          title="¿Para qué puede servirte ContactHub?"
          description="Empieza por lo que quieres resolver; la categoría correcta aparece después."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((item, index) => (
            <article key={item.title} className={`professional-card p-5 ${index === useCases.length - 1 ? 'lg:col-start-2' : ''}`}>
              <item.icon className="h-5 w-5 text-brand-400" />
              <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
