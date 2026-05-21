import { LockKeyhole } from 'lucide-react';
import type { PreviewContact } from '../../types';

type ContactPreviewCardProps = {
  contact: PreviewContact;
};

export default function ContactPreviewCard({ contact }: ContactPreviewCardProps) {
  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">{contact.name}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-400">{contact.description}</p>
        </div>
        <LockKeyhole className="h-5 w-5 flex-none text-brand-400" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-sm font-semibold text-gray-300">{contact.phoneMasked}</span>
        {contact.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
