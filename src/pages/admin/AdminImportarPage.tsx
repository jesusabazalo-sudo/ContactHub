import { UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { buildOfficialCategoryOptions, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import {
  importContactsWorkbook,
  parseContactsWorkbook,
  type ExcelImportPreview,
  type ExcelImportResult,
} from '../../services/excelContactsImportService';
import { formatPhone, maskPhone } from '../../utils/phone';

type CategoryOption = {
  id: string;
  name: string;
  icon?: string | null;
  slug?: string | null;
  sort_order?: number | null;
  short_description?: string | null;
  tags?: string[] | null;
} & OfficialCategoryDisplay;
type ParsedLine = { raw: string; name: string; phone: string; valid: boolean; sensitive?: boolean; sensitiveReason?: string; error?: string };

const phoneRegex = /(\+?[\d][\d\s\-\(\)]{6,18}[\d])/;
const sensitiveTerms = [
  'arma',
  'armas',
  'droga',
  'drogas',
  'hack',
  'hackeo',
  'cuenta robada',
  'datos personales',
  'base de datos privada',
  'documentos falsos',
  'estafa',
  'invadir',
  'espionaje',
];

function ensureClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase;
}

function countryFromPhone(phone: string) {
  const code = formatPhone(phone).match(/^(\+\d{1,3})/)?.[1] ?? '+51';
  const flags: Record<string, string> = { '+51': 'PE', '+52': 'MX', '+1': 'US' };
  return { countryCode: code, countryFlag: flags[code] ?? null };
}

function cleanName(raw: string, detectedPhone: string) {
  return (
    raw
      .replace(detectedPhone, '')
      .replace(/^\s*\d+[\).\-\s]+/, '')
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/\(\s*\)/g, ' ')
      .replace(/[()]/g, ' ')
      .replace(/^\s*[-—–:|]+\s*/, '')
      .replace(/\s*[-—–:|]+\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Contacto sin nombre'
  );
}

function parseLine(line: string): ParsedLine {
  const raw = line.trim();
  if (!raw) return { raw, name: '', phone: '', valid: false, error: 'Línea vacía' };

  const phoneMatch = raw.match(phoneRegex);
  if (!phoneMatch) return { raw, name: raw, phone: '', valid: false, error: 'No se detectó teléfono.' };

  const phone = formatPhone(sanitizePhone(phoneMatch[1]));
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return { raw, name: cleanName(raw, phoneMatch[1]), phone, valid: false, error: 'Teléfono demasiado corto.' };

  return { raw: sanitizeText(raw, 500), name: sanitizeText(cleanName(raw, phoneMatch[1]), 160), phone: sanitizePhone(phone), valid: true };
}

function detectSensitiveContent(value: string) {
  const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = sensitiveTerms.find((term) => normalized.includes(term));
  return match ? { sensitive: true, reason: `Coincidencia sensible: ${match}` } : { sensitive: false };
}

function normalizePhoneKey(phone: string) {
  return sanitizePhone(phone).replace(/\D/g, '');
}

function parseImportLine(line: string): ParsedLine {
  const parsed = parseLine(line);
  const sensitive = detectSensitiveContent(parsed.raw);
  return { ...parsed, sensitive: sensitive.sensitive, sensitiveReason: sensitive.reason };
}

function chunks<T>(arr: T[], n: number) {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, index) => arr.slice(index * n, index * n + n));
}

function isSyntheticCategoryId(id?: string | null) {
  return Boolean(id?.startsWith('missing:'));
}

export default function AdminImportarPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<Array<{ line: string; error: string }>>([]);
  const [realSavedCount, setRealSavedCount] = useState<number | null>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [excelPreview, setExcelPreview] = useState<ExcelImportPreview | null>(null);
  const [excelResult, setExcelResult] = useState<ExcelImportResult | null>(null);
  const [isExcelImporting, setIsExcelImporting] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement | null>(null);

  async function handleExcelFile(file?: File) {
    if (!file) return;
    setExcelResult(null);
    setResult('');
    setFailed([]);
    try {
      setProgress('Leyendo hoja Todos...');
      const preview = await parseContactsWorkbook(file);
      setExcelPreview(preview);
      toast.success(`${preview.totalRows} filas leídas desde ${file.name}`);
    } catch (fileError) {
      const message = fileError instanceof Error ? fileError.message : 'No se pudo leer el Excel.';
      setExcelPreview(null);
      toast.error(message);
    } finally {
      setProgress('');
    }
  }

  async function importExcel() {
    if (!excelPreview) return;
    setIsExcelImporting(true);
    setExcelResult(null);
    try {
      const imported = await importContactsWorkbook(excelPreview, categories, setProgress);
      setExcelResult(imported);
      if (imported.failed || imported.uncategorized) {
        toast.warning(`Importación terminada con ${imported.failed} fallos.`);
      } else {
        toast.success(`${imported.inserted} contactos importados correctamente.`);
      }
    } catch (excelError) {
      const message = excelError instanceof Error ? excelError.message : 'No se pudo importar el Excel.';
      toast.error(message);
      setExcelResult({
        inserted: 0,
        publicInserted: 0,
        reservedInserted: 0,
        failed: excelPreview.validRows.length,
        existingDuplicates: 0,
        invalid: excelPreview.invalidRows.length,
        reserved: excelPreview.reservedRows.length,
        inputDuplicates: excelPreview.duplicateRows.length,
        uncategorized: 0,
        byFolder: {},
        errors: [message],
      });
    } finally {
      setProgress('');
      setIsExcelImporting(false);
    }
  }

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const client = ensureClient();
      if (!client) {
        setCategories([]);
        setError('Falta conectar Supabase. Revisa tu archivo .env.local.');
        return;
      }
      const categoriesResult = await client
        .from('categories')
        .select('id, name, icon, slug, short_description, contacts_count, tags')
        .eq('is_active', true);

      if (categoriesResult.error) {
        console.error('Error cargando categorías:', categoriesResult.error);
        setCategories([]);
        setError(categoriesResult.error.message);
        return;
      }
      const nextCategories = buildOfficialCategoryOptions(categoriesResult.data ?? [])
        .filter((category) => category.displayOrder >= 1 && category.displayOrder <= 24)
        .slice(0, 24) as CategoryOption[];
      setCategories(nextCategories);
      setCategoryId((current) => {
        const currentStillValid = nextCategories.some((category) => category.id === current && !isSyntheticCategoryId(category.id));
        return currentStillValid ? current : nextCategories.find((category) => !isSyntheticCategoryId(category.id))?.id ?? '';
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar categorías.';
      console.error('Error cargando categorías para importar:', loadError);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isCategoryPickerOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setIsCategoryPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryPickerOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCategoryPickerOpen]);

  const parsedContacts = useMemo(() => text.split('\n').map(parseImportLine).filter((line) => line.raw), [text]);
  const validContacts = parsedContacts.filter((line) => line.valid);
  const invalidContacts = parsedContacts.filter((line) => !line.valid);
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;
  const uniqueContacts = useMemo(() => {
    const seen = new Set<string>();
    return validContacts.filter((contact) => {
      const key = normalizePhoneKey(contact.phone);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [validContacts]);
  const duplicateInputCount = validContacts.length - uniqueContacts.length;
  const sensitiveContacts = uniqueContacts.filter((line) => line.sensitive);
  const isVaultDestination = selectedCategory?.officialSlug === 'the-vault' || selectedCategory?.slug === 'the-vault';
  const importableContacts = uniqueContacts.filter((line) => !line.sensitive || isVaultDestination);
  const selectedCategoryIsReal = Boolean(selectedCategory?.id) && !isSyntheticCategoryId(selectedCategory?.id);
  const canImport = selectedCategoryIsReal && importableContacts.length > 0 && !isImporting;

  async function verifyCategoryContacts(selectedId: string) {
    const client = ensureClient();
    if (!client) return [];
    const { data, error: verifyError } = await client
      .from('contacts')
      .select('id,name,phone,category_id,status')
      .eq('category_id', selectedId)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('AdminImportarPage verify:', verifyError.message);
      return [];
    }
    return data ?? [];
  }

  async function importContacts() {
    const client = ensureClient();
    if (!client) {
      setResult('Falta conectar Supabase. Revisa tu archivo .env.local.');
      return;
    }
    setFailed([]);
    setResult('');
    setRealSavedCount(null);

    if (!selectedCategory?.id || isSyntheticCategoryId(selectedCategory.id)) {
      toast.error('Selecciona una carpeta real de Supabase. Esta carpeta oficial todavía no tiene ID vinculado.');
      return;
    }

    if (!importableContacts.length) {
      const noValidError = 'No hay contactos válidos para importar.';
      setResult(noValidError);
      if (import.meta.env.DEV) console.debug('CONTACTHUB_DEBUG_IMPORT', { selectedCategory, parsedContacts, insertedCount: 0, error: noValidError });
      return;
    }

    if (import.meta.env.DEV) console.debug('IMPORT_CATEGORY_SELECTED', selectedCategory);
    setIsImporting(true);
    let insertedCount = 0;
    let existingDuplicateCount = 0;
    const failedRows: Array<{ line: string; error: string }> = [];
    const insertedContacts: Array<{ id: string; name: string; phone: string; category_id: string; status: string }> = [];

    try {
      if (!isVaultDestination && sensitiveContacts.length) {
        failedRows.push(...sensitiveContacts.map((contact) => ({
          line: contact.raw,
          error: `${contact.sensitiveReason ?? 'Contenido sensible'}. No se publico; revisa y usa THE VAULT si corresponde.`,
        })));
      }

      const existingResult = await client
        .from('contacts')
        .select('phone')
        .eq('category_id', selectedCategory.id)
        .neq('status', 'inactive');
      if (existingResult.error) {
        console.error('AdminImportarPage duplicate check:', existingResult.error.message);
        throw new Error(`No se pudo verificar duplicados: ${existingResult.error.message}`);
      }

      const existingPhones = new Set((existingResult.data ?? []).map((row) => normalizePhoneKey(row.phone ?? '')).filter(Boolean));
      const contactsToInsert = importableContacts.filter((contact) => {
        const duplicate = existingPhones.has(normalizePhoneKey(contact.phone));
        if (duplicate) existingDuplicateCount += 1;
        return !duplicate;
      });
      const importChunks = chunks(contactsToInsert, 50);

      for (let index = 0; index < importChunks.length; index += 1) {
        const currentChunk = importChunks[index];
        setProgress(`Insertando lote ${index + 1} de ${importChunks.length}...`);

        const rows = currentChunk.map((contact) => {
          const country = countryFromPhone(contact.phone);
          const phone = sanitizePhone(contact.phone);
          const automaticTags = [
            ...(selectedCategory.tags ?? []),
            selectedCategory.displayTitle,
            ...contact.name.split(/\s+/),
          ]
            .map((tag) => sanitizeText(String(tag ?? ''), 28).toLowerCase())
            .filter((tag) => tag.length > 2)
            .filter((tag, tagIndex, allTags) => allTags.indexOf(tag) === tagIndex)
            .slice(0, 6);
          return {
            category_id: selectedCategory.id,
            subcategory_id: null,
            name: sanitizeText(contact.name, 160),
            description: `Contacto relacionado con ${selectedCategory.displaySubtitle || selectedCategory.short_description || selectedCategory.name}.`,
            phone,
            whatsapp: phone,
            phone_masked: maskPhone(contact.phone),
            country_code: country.countryCode,
            country_flag: country.countryFlag,
            tags: automaticTags,
            source: 'importador admin',
            status: contact.sensitive ? 'review' as const : 'active' as const,
            risk_level: contact.sensitive ? 'review' as const : 'safe' as const,
          };
        });

        const contactsTable = (client as unknown as { from: (table: string) => any }).from('contacts');
        let insertResult: any = await contactsTable.insert(rows).select('id,name,phone,category_id,status');
        if (insertResult.error && /whatsapp|schema cache|column/i.test(insertResult.error.message)) {
          const fallbackRows = rows.map(({ whatsapp: _whatsapp, ...row }) => row);
          insertResult = await contactsTable.insert(fallbackRows).select('id,name,phone,category_id,status');
        }
        const { data, error: insertError } = insertResult;
        if (insertError) {
          failedRows.push(...currentChunk.map((contact) => ({ line: contact.raw, error: insertError.message })));
          console.error('Error insertando lote de contactos:', insertError);
        } else {
          const savedRows = data ?? [];
          const wrongCategory = savedRows.find((contact: { category_id?: string | null }) => contact.category_id !== selectedCategory.id || !contact.category_id);
          if (wrongCategory) {
            const message = `Supabase guardó un contacto con category_id incorrecto: ${wrongCategory.category_id}`;
            console.error(message);
            failedRows.push(...currentChunk.map((contact) => ({ line: contact.raw, error: message })));
            continue;
          }
          insertedCount += savedRows.length;
          insertedContacts.push(...savedRows);
        }

        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }

      const verifyContacts = await verifyCategoryContacts(selectedCategory.id);
      setRealSavedCount(verifyContacts.length);
      setFailed(failedRows);

      if (import.meta.env.DEV) {
        console.debug('CONTACTHUB_IMPORT_VERIFY', {
          selectedCategory,
          insertedContacts,
          verifyCount: verifyContacts.length,
          verifyContacts,
        });
      }

      if (insertedCount === 0) {
        setResult(failedRows.length ? `No se importó ningún contacto. Error: ${failedRows[0].error}` : 'No se importó ningún contacto.');
      } else if (failedRows.length) {
        setResult(`${insertedCount} contactos importados. ${failedRows.length} líneas fallaron. Contactos guardados en: ${selectedCategory.name}.`);
      } else {
        setResult(`${insertedCount} contactos importados correctamente. Contactos guardados en: ${selectedCategory.name}.`);
      }

      const omittedDuplicates = duplicateInputCount + existingDuplicateCount;
      setResult(
        `${insertedCount} importados · ${omittedDuplicates} duplicados omitidos · ${invalidContacts.length} inválidos · ${
          !isVaultDestination ? sensitiveContacts.length : 0
        } sensibles separados. Destino: ${selectedCategory.displayLabel ?? selectedCategory.name}.`,
      );
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'No se pudo importar.';
      setResult(`No se pudo importar: ${message}`);
      console.error('Error importando contactos:', importError);
      if (import.meta.env.DEV) console.debug('CONTACTHUB_DEBUG_IMPORT', { selectedCategory, parsedContacts, insertedCount, error: message });
    } finally {
      setProgress('');
      setIsImporting(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando importador" message="Preparando categorías reales desde Supabase." />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="mx-auto w-full max-w-7xl rounded-2xl border border-border bg-surface px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-content">Importar contactos</h2>
            <p className="mt-2 text-sm text-content-secondary">Pega una lista, revisa la vista previa y guarda solo los contactos válidos.</p>
          </div>
          <button type="button" onClick={loadCategories} className="focus-ring rounded-full border border-border bg-muted px-4 py-2 text-sm font-bold text-content hover:border-brand-400/35">
            Reintentar categorías
          </button>
        </div>

        {error ? <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{error}</div> : null}
        {!error && categories.length === 0 ? (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <span>No hay categorías activas disponibles. Reintenta la carga desde Supabase.</span>
            <button type="button" onClick={loadCategories} className="focus-ring rounded-full bg-amber-200 px-4 py-2 text-xs font-bold text-ink-950">
              Reintentar
            </button>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-brand-400/25 bg-brand-400/[0.06] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text">Importación Excel por 24 carpetas</p>
              <h3 className="mt-1 text-lg font-bold text-content">Cargar hoja “Todos” de forma segura</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-content-secondary">
                Valida teléfonos, usa Carpeta ID, omite duplicados y separa registros reservados antes de guardar.
              </p>
            </div>
            <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 hover:bg-brand-300">
              <UploadCloud className="h-4 w-4" />
              Seleccionar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                onChange={(event) => void handleExcelFile(event.target.files?.[0])}
              />
            </label>
          </div>

          {excelPreview ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-content">{excelPreview.fileName}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ['Filas', excelPreview.totalRows, 'text-content'],
                  ['Listos', excelPreview.validRows.length, 'text-brand-text'],
                  ['Reservados', excelPreview.reservedRows.length, 'text-amber-200'],
                  ['Inválidos', excelPreview.invalidRows.length, 'text-red-200'],
                  ['Duplicados', excelPreview.duplicateRows.length, 'text-sky-200'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-xl border border-border bg-canvas/55 p-3">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-content-muted">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {Array.from({ length: 24 }, (_, index) => index + 1).map((order) => (
                  <div key={order} className="rounded-lg bg-muted px-3 py-2 text-xs text-content-secondary">
                    <span className="font-bold text-content">{String(order).padStart(2, '0')}</span>
                    <span className="ml-2">{excelPreview.byFolder[order] ?? 0}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={isExcelImporting || !excelPreview.validRows.length || categories.some((category) => isSyntheticCategoryId(category.id))}
                onClick={() => void importExcel()}
                className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 hover:bg-brand-300 disabled:cursor-not-allowed disabled:bg-muted disabled:text-content-muted sm:w-auto"
              >
                <UploadCloud className="h-4 w-4" />
                {isExcelImporting ? 'Importando...' : `Importar ${excelPreview.validRows.length} contactos validados`}
              </button>
            </div>
          ) : null}

          {excelResult ? (
            <div className="mt-5 rounded-xl border border-border bg-canvas/65 p-4 text-sm text-content-secondary">
              <p className="font-bold text-content">Resultado de importación</p>
              <p className="mt-2">
                {excelResult.inserted} importados ({excelResult.publicInserted} públicos + {excelResult.reservedInserted} reservados) · {excelResult.invalid} inválidos ·{' '}
                {excelResult.inputDuplicates + excelResult.existingDuplicates} duplicados · {excelResult.uncategorized} sin categoría.
              </p>
              {excelResult.errors.map((message) => <p key={message} className="mt-2 text-red-200">{message}</p>)}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
          <div className="w-full space-y-4">
            <div ref={categoryPickerRef} className="relative grid gap-2">
              <span className="text-sm font-semibold text-content-secondary">Categoría destino</span>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen((current) => !current)}
                className="focus-ring flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-canvas/70 px-4 py-3 text-left text-sm font-semibold text-content hover:border-brand-400/45"
                aria-expanded={isCategoryPickerOpen}
              >
                <span className="min-w-0 truncate">{selectedCategory?.displayLabel ?? 'Selecciona una carpeta...'}</span>
                <span className="shrink-0 text-brand-text">{isCategoryPickerOpen ? '▲' : '▼'}</span>
              </button>
              {isCategoryPickerOpen ? (
                <div className="absolute left-0 right-0 top-[76px] z-30 max-h-[380px] overflow-y-auto rounded-2xl border border-brand-400/25 bg-canvas/95 p-2 shadow-2xl shadow-black/40">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(category.id);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`focus-ring flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                        categoryId === category.id ? 'bg-brand-400/20 text-content ring-1 ring-brand-400/40' : 'text-content-secondary hover:bg-muted hover:text-content'
                      }`}
                    >
                      <span className="mt-0.5 w-6 shrink-0 text-center text-lg">{category.displayIcon}</span>
                      <span className="min-w-0">
                        <span className="block font-bold leading-snug">
                          {String(category.displayOrder).padStart(2, '0')}. {category.displayTitle}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-muted">
                          {category.displaySubtitle}
                          {isSyntheticCategoryId(category.id) ? ' · falta crear en Supabase' : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-canvas/50 p-4 text-sm leading-6 text-content-secondary">
              <p className="font-semibold text-content">Destino: {selectedCategory?.displayLabel ?? 'Selecciona una categoría'}</p>
              {selectedCategory?.id ? <p className="mt-1 truncate text-xs text-content-muted">{selectedCategory.id}</p> : null}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold text-brand-text">{importableContacts.length}</p>
                  <p className="text-xs text-content-muted">listos</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold text-amber-200">{invalidContacts.length}</p>
                  <p className="text-xs text-content-muted">inválidos</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold text-sky-200">{duplicateInputCount}</p>
                  <p className="text-xs text-content-muted">duplicados en lista</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold text-red-200">{sensitiveContacts.length}</p>
                  <p className="text-xs text-content-muted">sensibles</p>
                </div>
              </div>
              {realSavedCount !== null ? <p className="mt-4 text-brand-text">Ahora hay {realSavedCount} contactos reales en esta categoría.</p> : null}
            </div>

            <button
              type="button"
              disabled={!canImport}
              onClick={() => void importContacts()}
              className={`focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                canImport ? 'bg-brand-400 text-ink-950 hover:bg-brand-300' : 'cursor-not-allowed bg-muted text-content-muted'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              {importableContacts.length ? `Importar ${importableContacts.length} contactos` : 'No hay contactos válidos'}
            </button>

            {progress ? <p className="text-sm text-brand-text">{progress}</p> : null}
            {result ? <p className="rounded-lg border border-border bg-canvas/50 p-4 text-sm font-semibold text-content">{result}</p> : null}
          </div>

          <div className="grid w-full min-w-0 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-content-secondary">Contactos</span>
              <textarea
                value={text}
                onChange={(event) => {
                  setText(sanitizeTextInput(event.target.value, 150000));
                  setResult('');
                  setFailed([]);
                  setRealSavedCount(null);
                }}
                rows={13}
                placeholder={'Pega aquí tus contactos, uno por línea.\nEjemplo:\nPack Minero +51 915 151 528\nVender PDFs de Alto Curso +51 998 801 893'}
                className="focus-ring min-h-[320px] w-full resize-y rounded-2xl border border-border bg-canvas/70 px-4 py-3 font-mono text-sm text-content"
              />
            </label>

            <div className="max-h-[360px] overflow-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-canvas/70 text-xs uppercase text-content-muted">
                  <tr>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Teléfono formateado</th>
                    <th className="px-4 py-3">Línea original</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedContacts.map((line, index) => (
                    <tr key={`${line.raw}-${index}`} className={`border-t border-border ${line.sensitive ? 'bg-amber-500/10' : line.valid ? '' : 'bg-red-500/10'}`}>
                      <td className={`px-4 py-3 font-bold ${line.sensitive ? 'text-amber-200' : line.valid ? 'text-brand-text' : 'text-red-200'}`}>
                        {line.sensitive ? 'REVISAR' : line.valid ? '✓' : '✕'}
                      </td>
                      <td className="px-4 py-3 text-content">{line.name}</td>
                      <td className="px-4 py-3 font-mono text-content-secondary">{line.phone || line.error}</td>
                      <td className="px-4 py-3 text-xs text-content-muted">
                        {line.raw}
                        {line.sensitiveReason ? <span className="mt-1 block text-amber-200">{line.sensitiveReason}</span> : null}
                      </td>
                    </tr>
                  ))}
                  {!parsedContacts.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-content-muted">
                        La vista previa aparecerá aquí.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {failed.length ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            {failed.map((item) => (
              <p key={item.line}>
                {item.line}: {item.error}
              </p>
            ))}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
