/** Fallback genérico para Suspense: header + 3 bloques, mientras carga el chunk de una página lazy. */
export default function PageSkeleton() {
  return (
    <section className="section-pad min-h-screen" aria-hidden="true">
      <div className="container-shell">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-9 w-2/3 rounded-full bg-muted sm:w-1/2" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-muted" />
        </div>
        <div className="mt-10 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-2xl border border-border bg-surface">
              <div className="h-full w-full rounded-2xl bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
