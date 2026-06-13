import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export type ContactsBackupResult = {
  ok: boolean;
  backupTable: string;
  backedUpCount: number;
  error?: string;
};

function maintenanceClient() {
  return supabase as unknown as {
    from: (table: string) => any;
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: { message: string } | null }>;
  } | null;
}

export async function createContactsBackup(): Promise<ContactsBackupResult> {
  const client = maintenanceClient();
  if (!client || !isSupabaseConfigured) {
    return { ok: false, backupTable: '', backedUpCount: 0, error: 'Supabase no está conectado.' };
  }

  const { data, error } = await client.rpc('backup_contacts_snapshot');
  if (error) {
    console.error('createContactsBackup:', error.message);
    return { ok: false, backupTable: '', backedUpCount: 0, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    backupTable: String(row?.backup_table ?? ''),
    backedUpCount: Number(row?.backed_up_count ?? 0),
  };
}

export async function archiveContactsAfterBackup(backupTable: string) {
  const client = maintenanceClient();
  if (!client || !isSupabaseConfigured || !backupTable) {
    return { ok: false, archivedCount: 0, error: 'Primero crea un backup válido.' };
  }

  const { data, error } = await client.rpc('archive_contacts_after_backup', { p_backup_table: backupTable });
  if (error) {
    console.error('archiveContactsAfterBackup:', error.message);
    return { ok: false, archivedCount: 0, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, archivedCount: Number(row?.archived_count ?? 0) };
}

export async function downloadContactsCsvBackup() {
  const client = maintenanceClient();
  if (!client || !isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase no está conectado.' };

  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await client.from('contacts').select('*').range(start, start + pageSize - 1);
    if (error) {
      console.error('downloadContactsCsvBackup:', error.message);
      return { ok: false, count: rows.length, error: error.message };
    }
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  if (!rows.length) return { ok: true, count: 0 };
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCell = (value: unknown) => {
    const text = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\r\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `contacts_backup_${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  return { ok: true, count: rows.length };
}
