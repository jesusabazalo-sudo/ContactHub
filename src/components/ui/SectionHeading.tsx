type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export default function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-text">{eyebrow}</p> : null}
      <h2 className="font-display font-bold leading-tight text-content" style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.25rem)' }}>
        <span className="neon-text">{title}</span>
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-content-secondary sm:text-lg">{description}</p> : null}
    </div>
  );
}
