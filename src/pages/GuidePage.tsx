import QuickGuide from '../components/onboarding/QuickGuide';
import SectionHeading from '../components/ui/SectionHeading';

export default function GuidePage() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Guía rápida"
          title="Cómo empezar en ContactHub"
          description="Una ruta simple para explorar, probar contactos, desbloquear carpetas y pedir ayuda sin perderte."
        />
        <div className="mt-10">
          <QuickGuide mode="full" forceOpen />
        </div>
      </div>
    </section>
  );
}
