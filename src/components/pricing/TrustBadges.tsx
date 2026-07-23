import { ClipboardCheck, Lock, MessageCircle, Zap } from 'lucide-react';

const badges = [
  { icon: Lock, label: 'Pago seguro' },
  { icon: ClipboardCheck, label: 'Proceso transparente' },
  { icon: Zap, label: 'Activación manual' },
  { icon: MessageCircle, label: 'Soporte por chat' },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-content-secondary"
        >
          <badge.icon className="h-3.5 w-3.5 text-brand-text" aria-hidden="true" />
          {badge.label}
        </span>
      ))}
    </div>
  );
}
