import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ContactCard from '../contacts/ContactCard';
import ProgressBar from '../ui/ProgressBar';
import EmptyFoldersIllustration from './EmptyFoldersIllustration';
import type { UnlockedAccess, UnlockedContact, UnlockedFolder } from '../../services/myContactsService';
import { formatDate } from '../../lib/format';

type FoldersSectionProps = {
  folders: UnlockedFolder[];
  accessHistory: UnlockedAccess[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  filteredContacts: Array<UnlockedContact & { categoryName?: string }>;
  totalContacts: number;
  usedThisMonth: number;
  usedByCategory: Map<string, number>;
  onOpenSupportChat: (message: string) => void;
};

export default function FoldersSection({
  folders,
  accessHistory,
  activeCategoryId,
  onSelectCategory,
  filteredContacts,
  totalContacts,
  usedThisMonth,
  usedByCategory,
  onOpenSupportChat,
}: FoldersSectionProps) {
  if (!folders.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center sm:p-12">
        <EmptyFoldersIllustration />
        <h3 className="mt-4 font-display text-xl font-bold text-content">Aún no tienes carpetas desbloqueadas</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-content-secondary">
          Explora el catálogo y consigue acceso a las categorías que más te interesen.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/catalogo" className="focus-ring rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-contrast transition hover:bg-brand-hover">
            Ver catálogo →
          </Link>
          <Link to="/?trial=1" className="focus-ring rounded-full border border-border bg-muted px-5 py-3 text-sm font-bold text-content transition hover:border-brand/40">
            Probar 3 contactos gratis
          </Link>
        </div>
      </div>
    );
  }

  const accessDateByCategory = new Map(accessHistory.map((access) => [access.categoryId, access.createdAt]));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-content-secondary">
        Tienes acceso a <strong className="text-content">{folders.length}</strong> carpeta{folders.length === 1 ? '' : 's'} ·{' '}
        <strong className="text-content">{totalContacts}</strong> contactos disponibles ·{' '}
        <strong className="text-content">{usedThisMonth}</strong> contactos usados este mes
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {folders.map((folder) => {
          const used = usedByCategory.get(folder.id) ?? 0;
          const progressPct = folder.contactsCount ? Math.min(100, Math.round((used / folder.contactsCount) * 100)) : 0;
          const accessDate = accessDateByCategory.get(folder.id);

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectCategory(folder.id)}
              className={`card-hover focus-ring rounded-2xl border p-5 text-left transition ${
                activeCategoryId === folder.id ? 'border-brand/50 bg-brand/[0.06]' : 'border-border bg-surface hover:border-brand/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-xl" aria-hidden="true">{folder.icon || '📁'}</span>
                  <span className="truncate text-base font-bold text-content">{folder.name}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-text">
                  ✓ Activo
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-content-secondary">{folder.contactsCount} contactos disponibles</p>
              {accessDate ? <p className="mt-1 text-xs text-content-muted">Acceso desde {formatDate(accessDate)}</p> : null}
              <div className="mt-4">
                <ProgressBar value={progressPct} label={`${used} usados`} />
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-text">
                Explorar carpeta <ArrowRight className="h-3 w-3" />
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-content">
              {activeCategoryId === 'all' ? 'Todos tus contactos' : folders.find((folder) => folder.id === activeCategoryId)?.name}
            </h3>
            <p className="mt-1 text-xs text-content-secondary">{filteredContacts.length} resultado(s)</p>
          </div>
          {activeCategoryId !== 'all' ? (
            <button type="button" onClick={() => onSelectCategory('all')} className="focus-ring rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold text-content-secondary transition hover:border-brand/40">
              Ver todas
            </button>
          ) : null}
        </div>

        {filteredContacts.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                canSeeFullPhone
                canContactDirect
                accessLevel={2}
                categoryName={contact.categoryName || 'ContactHub'}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted p-6 text-center text-sm text-content-secondary">
            No hay contactos con ese filtro.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpenSupportChat('Hola, tengo dudas sobre mis carpetas desbloqueadas en ContactHub.')}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-5 py-3 text-sm font-bold text-brand-text transition hover:bg-brand/20"
      >
        <MessageCircle className="h-4 w-4" />
        ¿Dudas sobre tu acceso? Escríbenos
      </button>
    </div>
  );
}
