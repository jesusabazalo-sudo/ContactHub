import * as XLSX from 'xlsx';
import type { OfficialCategoryDisplay } from '../data/officialCategories';
import { sanitizeText } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getCountryCode, getFlag } from './adminContactsService';
import { maskPhone, phoneToWhatsapp } from '../utils/phone';

type CategoryOption = {
  id: string;
  displayOrder: number;
  displayTitle: string;
  displaySubtitle: string;
  tags?: string[] | null;
} & Partial<OfficialCategoryDisplay>;

type ExcelContactRow = {
  'ID original'?: string | number;
  'Orden carpeta'?: string | number;
  Descripción?: string;
  Teléfono?: string | number;
  'Carpeta ID'?: string | number;
  Carpeta?: string;
  Estado?: string;
  'Motivo/criterio'?: string;
  Nota?: string;
};

export type PreparedExcelContact = {
  sourceRow: number;
  originalId: string;
  folderOrder: number;
  folderLabel: string;
  name: string;
  phone: string;
  rawPhone: string;
  phoneStatus: 'valid' | 'needs_review';
  whatsapp: string;
  statusLabel: string;
  internalNote: string;
  valid: boolean;
  reserved: boolean;
  duplicate: boolean;
  error?: string;
};

export type ExcelImportPreview = {
  fileName: string;
  totalRows: number;
  validRows: PreparedExcelContact[];
  invalidRows: PreparedExcelContact[];
  reservedRows: PreparedExcelContact[];
  duplicateRows: PreparedExcelContact[];
  byFolder: Record<number, number>;
};

export type ExcelImportResult = {
  inserted: number;
  publicInserted: number;
  reservedInserted: number;
  failed: number;
  existingDuplicates: number;
  invalid: number;
  reserved: number;
  inputDuplicates: number;
  uncategorized: number;
  byFolder: Record<number, number>;
  errors: string[];
};

function normalizeRawPhone(value: unknown) {
  return sanitizeText(String(value ?? ''), 80);
}

function normalizePhone(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw || /revisar|documento original|sin tel|pendiente/i.test(raw)) return '';

  const compact = raw.replace(/[^\d+]/g, '');
  const digits = compact.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';

  if (compact.startsWith('+')) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `+51${digits}`;
  if (digits.startsWith('51') && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

function buildInternalNote(row: ExcelContactRow) {
  return [row['Motivo/criterio'], row.Nota]
    .map((value) => sanitizeText(String(value ?? ''), 350))
    .filter(Boolean)
    .join(' | ')
    .slice(0, 700);
}

function getFolderOrder(row: ExcelContactRow) {
  const value = Number(row['Carpeta ID'] ?? row['Orden carpeta']);
  return Number.isInteger(value) ? value : 0;
}

export async function parseContactsWorkbook(file: File): Promise<ExcelImportPreview> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets.Todos;
  if (!sheet) throw new Error('El archivo no contiene la hoja obligatoria "Todos".');

  const rows = XLSX.utils.sheet_to_json<ExcelContactRow>(sheet, { defval: '', raw: false });
  const seen = new Set<string>();
  const prepared = rows.map((row, index): PreparedExcelContact => {
    const folderOrder = getFolderOrder(row);
    const rawPhone = normalizeRawPhone(row.Teléfono);
    const phone = normalizePhone(rawPhone);
    const reserved = folderOrder === 18 || /reservado|revisión/i.test(String(row.Estado ?? ''));
    const key = phone ? `${folderOrder}:${phone.replace(/\D/g, '')}` : '';
    const duplicate = Boolean(key && seen.has(key));
    if (key) seen.add(key);

    let error = '';
    if (folderOrder < 1 || folderOrder > 24) error = 'Carpeta ID fuera del rango oficial 1-24.';
    else if (!phone && !reserved) error = 'Teléfono vacío o formato inválido.';

    return {
      sourceRow: index + 2,
      originalId: sanitizeText(String(row['ID original'] ?? ''), 80),
      folderOrder,
      folderLabel: sanitizeText(String(row.Carpeta ?? ''), 220),
      name: sanitizeText(String(row.Descripción ?? ''), 160) || 'Contacto sin descripción',
      phone,
      rawPhone,
      phoneStatus: phone ? 'valid' : 'needs_review',
      whatsapp: phoneToWhatsapp(phone),
      statusLabel: sanitizeText(String(row.Estado ?? ''), 80),
      internalNote: buildInternalNote(row),
      valid: !error && !duplicate,
      reserved,
      duplicate,
      error: error || (duplicate ? 'Teléfono duplicado dentro de la misma carpeta.' : reserved ? 'Contacto reservado para revisión admin.' : undefined),
    };
  });

  const validRows = prepared.filter((row) => row.valid);
  const byFolder = validRows.reduce<Record<number, number>>((totals, row) => {
    totals[row.folderOrder] = (totals[row.folderOrder] ?? 0) + 1;
    return totals;
  }, {});

  return {
    fileName: file.name,
    totalRows: prepared.length,
    validRows,
    invalidRows: prepared.filter((row) => (!row.phone && !row.reserved) || row.folderOrder < 1 || row.folderOrder > 24),
    reservedRows: prepared.filter((row) => row.reserved),
    duplicateRows: prepared.filter((row) => row.duplicate),
    byFolder,
  };
}

function automaticTags(contact: PreparedExcelContact, category: CategoryOption) {
  return [
    ...(category.tags ?? []),
    category.displayTitle,
    category.displaySubtitle,
    ...contact.name.split(/\s+/),
  ]
    .map((tag) => sanitizeText(String(tag ?? ''), 28).toLowerCase())
    .filter((tag) => tag.length > 2)
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 8);
}

function chunks<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

export async function importContactsWorkbook(
  preview: ExcelImportPreview,
  categories: CategoryOption[],
  onProgress?: (message: string) => void,
): Promise<ExcelImportResult> {
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase no está configurado.');

  const categoryByOrder = new Map(
    categories
      .filter((category) => category.id && !category.id.startsWith('missing:'))
      .map((category) => [category.displayOrder, category]),
  );
  const missingOrders = [...new Set(preview.validRows.map((row) => row.folderOrder))]
    .filter((order) => !categoryByOrder.has(order));
  if (missingOrders.length) {
    throw new Error(`Faltan categorías reales de Supabase para: ${missingOrders.join(', ')}.`);
  }

  const existingKeys = new Set<string>();
  const existingReviewKeys = new Set<string>();
  for (const category of categoryByOrder.values()) {
    const { data, error } = await supabase
      .from('contacts')
      .select('phone,status,name')
      .eq('category_id', category.id)
      .neq('status', 'inactive');
    if (error) throw new Error(`No se pudieron revisar duplicados de carpeta ${category.displayOrder}: ${error.message}`);
    for (const row of data ?? []) {
      const digits = String(row.phone ?? '').replace(/\D/g, '');
      if (digits) existingKeys.add(`${category.id}:${digits}`);
      if (row.status === 'review') {
        existingReviewKeys.add(`${category.id}:${sanitizeText(String(row.name ?? ''), 160).toLowerCase()}`);
      }
    }
  }

  let existingDuplicates = 0;
  const rowsToInsert = preview.validRows.filter((contact) => {
    const category = categoryByOrder.get(contact.folderOrder);
    if (!contact.phone) {
      const reviewKey = `${category?.id}:${contact.name.toLowerCase()}`;
      if (existingReviewKeys.has(reviewKey)) {
        existingDuplicates += 1;
        return false;
      }
      existingReviewKeys.add(reviewKey);
      return true;
    }
    const key = `${category?.id}:${contact.phone.replace(/\D/g, '')}`;
    if (existingKeys.has(key)) {
      existingDuplicates += 1;
      return false;
    }
    existingKeys.add(key);
    return true;
  });

  let inserted = 0;
  let publicInserted = 0;
  let reservedInserted = 0;
  let failed = 0;
  let uncategorized = 0;
  const errors: string[] = [];
  const insertedByFolder: Record<number, number> = {};
  const batches = chunks(rowsToInsert, 50);

  for (let index = 0; index < batches.length; index += 1) {
    onProgress?.(`Importando lote ${index + 1} de ${batches.length}...`);
    const batch = batches[index];
    const payload = batch.map((contact) => {
      const category = categoryByOrder.get(contact.folderOrder);
      if (!category) uncategorized += 1;
      const isReserved = contact.reserved;
      return {
        category_id: category?.id ?? '',
        subcategory_id: null,
        name: contact.name,
        description: contact.name,
        phone: contact.phone || null,
        raw_phone: contact.rawPhone || null,
        phone_status: contact.phoneStatus,
        whatsapp: isReserved ? null : contact.whatsapp,
        phone_masked: isReserved ? 'Reservado para revisión' : maskPhone(contact.phone),
        country_code: isReserved ? 'XX' : getCountryCode(contact.phone),
        country_flag: isReserved ? '⚠️' : getFlag(contact.phone),
        tags: isReserved
          ? ['revisión', 'reservado', 'admin']
          : category ? automaticTags(contact, category) : [],
        source: 'importacion_excel_1048_final',
        import_batch: 'importacion_excel_1048_final',
        import_note: contact.internalNote || null,
        visibility: isReserved ? 'restricted' : 'public',
        is_public: !isReserved,
        internal_note: [
          isReserved ? 'Contacto reservado/importado para revisión admin' : '',
          contact.internalNote,
          contact.originalId ? `ID original: ${contact.originalId}` : '',
          contact.folderLabel ? `Carpeta Excel: ${contact.folderLabel}` : '',
        ].filter(Boolean).join(' | ').slice(0, 700),
        status: isReserved ? 'review' as const : 'active' as const,
        risk_level: isReserved ? 'review' as const : 'safe' as const,
        is_active: true,
        deleted_at: null,
      };
    });

    const table = (supabase as unknown as { from: (name: string) => any }).from('contacts');
    const response: any = await table.insert(payload).select('id,category_id');

    if (response.error) {
      failed += batch.length;
      errors.push(`Lote ${index + 1}: ${response.error.message}`);
      continue;
    }

    inserted += response.data?.length ?? batch.length;
    for (const contact of batch) {
      insertedByFolder[contact.folderOrder] = (insertedByFolder[contact.folderOrder] ?? 0) + 1;
      if (contact.reserved) reservedInserted += 1;
      else publicInserted += 1;
    }
  }

  return {
    inserted,
    publicInserted,
    reservedInserted,
    failed,
    existingDuplicates,
    invalid: preview.invalidRows.length,
    reserved: preview.reservedRows.length,
    inputDuplicates: preview.duplicateRows.length,
    uncategorized,
    byFolder: insertedByFolder,
    errors,
  };
}
