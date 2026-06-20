import { Archive, DatabaseBackup, Download, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  archiveContactsAfterBackup,
  createContactsBackup,
  downloadContactsCsvBackup,
} from '../../services/contactsMaintenanceService';

type Props = {
  onArchived: () => Promise<void> | void;
};

export default function ContactsMaintenancePanel({ onArchived }: Props) {
  const [backupTable, setBackupTable] = useState('');
  const [backupCount, setBackupCount] = useState(0);
  const [confirmation, setConfirmation] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  async function downloadCsv() {
    setIsWorking(true);
    try {
      const result = await downloadContactsCsvBackup();
      if (!result.ok) {
        toast.error(result.error ?? 'No se pudo generar el CSV.');
        return;
      }
      toast.success(result.count ? `CSV generado con ${result.count} contactos.` : 'No hay contactos para exportar.');
    } finally {
      setIsWorking(false);
    }
  }

  async function createBackup() {
    setIsWorking(true);
    try {
      const result = await createContactsBackup();
      if (!result.ok) {
        toast.error(result.error?.includes('backup_contacts_snapshot') ? 'Ejecuta la migraciÃ³n 020 antes de crear el backup.' : result.error);
        return;
      }
      setBackupTable(result.backupTable);
      setBackupCount(result.backedUpCount);
      setConfirmation('');
      toast.success(`Backup creado: ${result.backupTable}`);
    } finally {
      setIsWorking(false);
    }
  }

  async function archiveAll() {
    if (!backupTable || confirmation !== 'ARCHIVAR CONTACTOS') return;

    setIsWorking(true);
    try {
      const result = await archiveContactsAfterBackup(backupTable);
      if (!result.ok) {
        toast.error(result.error ?? 'No se pudieron archivar los contactos.');
        return;
      }
      toast.success(`${result.archivedCount} contactos archivados de forma segura.`);
      setConfirmation('');
      await onArchived();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-100">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-content">Mantenimiento seguro de contactos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-content-secondary">
            Este flujo trabaja Ãºnicamente con <code className="text-brand-text">public.contacts</code>. Primero crea respaldo SQL y CSV; despuÃ©s permite archivar, nunca borrar otras tablas.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          disabled={isWorking}
          onClick={() => void downloadCsv()}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-bold text-content transition hover:border-brand-400/40 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Descargar CSV actual
        </button>
        <button
          type="button"
          disabled={isWorking}
          onClick={() => void createBackup()}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-brand-400/30 bg-brand-400/10 px-4 py-3 text-sm font-bold text-brand-text transition hover:bg-brand-400 hover:text-ink-950 disabled:opacity-50"
        >
          <DatabaseBackup className="h-4 w-4" />
          Crear backup en Supabase
        </button>
        <div className="rounded-xl border border-border bg-canvas/60 px-4 py-3 text-sm">
          <p className="font-semibold text-content">{backupTable || 'Backup pendiente'}</p>
          <p className="mt-1 text-xs text-content-muted">{backupTable ? `${backupCount} contactos respaldados` : 'Archivar permanece bloqueado.'}</p>
        </div>
      </div>

      {backupTable ? (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
          <p className="text-sm font-semibold text-content">Paso destructivo controlado</p>
          <p className="mt-1 text-xs leading-5 text-content-secondary">
            Escribe <strong className="text-red-200">ARCHIVAR CONTACTOS</strong>. Se aplicarÃ¡ soft delete mediante <code>is_active=false</code>, <code>deleted_at</code> y estado inactivo.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="ARCHIVAR CONTACTOS"
              className="focus-ring h-11 flex-1 rounded-xl border border-red-400/20 bg-canvas/70 px-4 text-sm text-content placeholder:text-content-muted"
            />
            <button
              type="button"
              disabled={isWorking || confirmation !== 'ARCHIVAR CONTACTOS'}
              onClick={() => void archiveAll()}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-content disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Archive className="h-4 w-4" />
              Archivar contactos actuales
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
