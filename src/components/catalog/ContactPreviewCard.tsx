import { LockKeyhole } from 'lucide-react';
import type { PreviewContact } from '../../types';
import { maskPhone } from '../../utils/phone';

type ContactPreviewCardProps = {
  contact: PreviewContact;
};

export default function ContactPreviewCard({ contact }: ContactPreviewCardProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-content">{contact.name}</h3>
          <p className="mt-2 text-sm leading-6 text-content-secondary">{contact.description}</p>
        </div>
        <LockKeyhole className="h-5 w-5 flex-none text-brand-text" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-content-secondary">{maskPhone(contact.phoneMasked)}</span>
        {contact.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-content-secondary">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
