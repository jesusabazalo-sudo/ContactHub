/**
 * Fondo ambiental sutil y theme-aware. Reemplaza los antiguos fondos de canvas
 * (grietas/fuego/figuras neón) por una textura premium discreta: un halo de
 * marca muy tenue en la parte superior y una rejilla casi imperceptible que se
 * desvanece. Sin animaciones agresivas — prioriza claridad y confianza.
 */
export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Halo de marca superior */}
      <div
        className="absolute inset-x-0 top-0 h-[42rem]"
        style={{
          background:
            'radial-gradient(48rem 28rem at 50% -8%, rgb(var(--brand) / 0.10), transparent 70%)',
        }}
      />
      {/* Rejilla tenue, desvanecida hacia los bordes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--content) / 0.022) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--content) / 0.022) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%)',
        }}
      />
    </div>
  );
}
