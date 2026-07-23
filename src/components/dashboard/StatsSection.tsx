import { Calendar, Folder, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { RecentActivity } from '../../lib/activityTracking';
import type { UnlockedFolder } from '../../services/myContactsService';

type StatsSectionProps = {
  folders: UnlockedFolder[];
  totalContacts: number;
  activity: RecentActivity[];
  memberSince: string | null;
};

const WEEKDAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function memberDurationLabel(memberSince: string | null) {
  if (!memberSince) return 'Recién llegado';
  const days = Math.floor((Date.now() - new Date(memberSince).getTime()) / 86_400_000);
  if (days < 1) return 'Hoy';
  if (days < 7) return `${days} día${days === 1 ? '' : 's'}`;
  if (days < 30) return `${Math.floor(days / 7)} semana${Math.floor(days / 7) === 1 ? '' : 's'}`;
  return `${Math.floor(days / 30)} mes${Math.floor(days / 30) === 1 ? '' : 'es'}`;
}

export default function StatsSection({ folders, totalContacts, activity, memberSince }: StatsSectionProps) {
  const usedContactsCount = useMemo(() => new Set(activity.map((item) => item.contactId)).size, [activity]);

  const last7Days = useMemo(() => {
    const days: Array<{ key: string; label: string; count: number; dayNumber: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      days.push({ key, label: WEEKDAY_LABELS[date.getDay()], count: 0, dayNumber: date.getDate() });
    }
    const dayIndex = new Map(days.map((day) => [day.key, day]));
    activity.forEach((item) => {
      const key = item.createdAt.slice(0, 10);
      const day = dayIndex.get(key);
      if (day) day.count += 1;
    });
    return days;
  }, [activity]);

  const maxCount = Math.max(1, ...last7Days.map((day) => day.count));

  const mostUsedFolder = useMemo(() => {
    if (!folders.length) return null;
    const countByCategory = new Map<string, number>();
    activity.forEach((item) => countByCategory.set(item.categoryId, (countByCategory.get(item.categoryId) ?? 0) + 1));
    if (!countByCategory.size) return folders[0];
    const topId = [...countByCategory.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return folders.find((folder) => folder.id === topId) ?? folders[0];
  }, [activity, folders]);

  const statCards = [
    { label: 'Carpetas activas', value: folders.length, icon: Folder },
    { label: 'Contactos disponibles', value: totalContacts, icon: Users },
    { label: 'Contactos usados', value: usedContactsCount, icon: TrendingUp },
    { label: 'Miembro hace', value: memberDurationLabel(memberSince), icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-content-muted">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.1em]">{card.label}</p>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-content">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-bold text-content">Actividad de los últimos 7 días</h3>
        <div className="mt-6 flex h-32 items-end gap-3">
          {last7Days.map((day) => (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                title={`${day.count} acción${day.count === 1 ? '' : 'es'} el ${day.label} ${day.dayNumber}`}
                className="w-full rounded-t-md bg-brand/70 transition hover:bg-brand"
                style={{ height: `${Math.max(4, Math.round((day.count / maxCount) * 100))}%` }}
              />
              <span className="text-[10px] font-semibold uppercase text-content-muted">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {mostUsedFolder ? (
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-text">Tu carpeta más activa</p>
          <p className="mt-2 flex items-center gap-2 font-display text-xl font-bold text-content">
            <span aria-hidden="true">{mostUsedFolder.icon || '📁'}</span>
            {mostUsedFolder.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}
