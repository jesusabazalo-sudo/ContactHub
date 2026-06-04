type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export default function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-400">{eyebrow}</p> : null}
      <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
        <span className="neon-text">{title}</span>
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-gray-300 sm:text-lg">{description}</p> : null}
    </div>
  );
}
