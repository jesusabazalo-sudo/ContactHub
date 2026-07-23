import { Clipboard, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '../../lib/format';
import { buildContactWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp';
import { formatPhone } from '../../utils/phone';
import type { RecentActivity } from '../../lib/activityTracking';
import type { UnlockedContact } from '../../services/myContactsService';

type RecentActivitySectionProps = {
  activity: RecentActivity[];
  contactsById: Map<string, UnlockedContact>;
  isLoading: boolean;
};

async function copyPhone(phone: string) {
  try {
    await navigator.clipboard.writeText(formatPhone(phone));
    toast.success('Número copiado');
  } catch {
    toast.error('No se pudo copiar el número.');
  }
}

export default function RecentActivitySection({ activity, contactsById, isLoading }: RecentActivitySectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton-block h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!activity.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h3 className="font-display text-lg font-bold text-content">Aquí aparecerán los contactos que uses</h3>
        <p className="mt-2 text-sm leading-6 text-content-secondary">Explora tus carpetas y copia o contacta proveedores.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {activity.map((item) => {
        const contact = contactsById.get(item.contactId);
        const whatsappUrl = contact ? buildWhatsAppLink(contact.phone, buildContactWhatsAppMessage(contact.name, item.categoryName)) : '';

        return (
          <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-content">{item.contactName}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-content-secondary">
                <span aria-hidden="true">{item.categoryIcon}</span>
                {item.categoryName}
                <span className="text-content-muted">·</span>
                {item.action === 'copy' ? 'Número copiado' : 'Contactado por WhatsApp'}
                <span className="text-content-muted">·</span>
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
            {contact ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void copyPhone(contact.phone)}
                  className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-xs font-bold text-content transition hover:border-brand/40"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Copiar
                </button>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-xs font-bold text-white transition hover:bg-[#1eb858]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
