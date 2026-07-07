import type { PropsWithChildren, ReactNode } from 'react';
import { LEGAL } from '../../config/app';

type LegalLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  intro?: string;
}>;

export default function LegalLayout({ eyebrow, title, intro, children }: LegalLayoutProps) {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-content sm:text-4xl">{title}</h1>
        <p className="mt-3 text-xs text-content-muted">Última actualización: {LEGAL.updated}</p>
        {intro ? <p className="mt-5 text-base leading-7 text-content-secondary">{intro}</p> : null}
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-content">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-content-secondary [&_a]:text-brand-text [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-content">
        {children}
      </div>
    </div>
  );
}

/** Bloque destacado con los datos del titular (se repite en varias páginas). */
export function LegalIdentity() {
  return (
    <div className="rounded-xl border border-border bg-muted p-4 text-sm leading-6 text-content-secondary">
      <p><strong className="text-content">Titular:</strong> {LEGAL.titular}</p>
      <p><strong className="text-content">Operado por:</strong> {LEGAL.operadoPor}</p>
      <p><strong className="text-content">RUC:</strong> {LEGAL.ruc}</p>
      <p><strong className="text-content">Domicilio:</strong> {LEGAL.domicilio}</p>
      <p><strong className="text-content">Contacto:</strong> {LEGAL.email}</p>
    </div>
  );
}
