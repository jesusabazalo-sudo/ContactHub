import { UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import LoadingState from '../../components/system/LoadingState';
import { normalizeOfficialCategoryRows, type OfficialCategoryDisplay } from '../../data/officialCategories';
import { sanitizePhone, sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { formatPhone, maskPhone } from '../../utils/phone';

type CategoryOption = {
  id: string;
  name: string;
  icon?: string | null;
  slug?: string | null;
  sort_order?: number | null;
  short_description?: string | null;
} & OfficialCategoryDisplay;
type ParsedLine = { raw: string; name: string; phone: string; valid: boolean; error?: string };

const phoneRegex = /(\+?[\d][\d\s\-\(\)]{6,18}[\d])/;

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

function chunks<T>(arr: T[], n: number) {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, index) => arr.slice(index * n, index * n + n));
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
  const categoryPickerRef = useRef<HTMLDivElement | null>(null);

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
      const categoriesWithOrder = await client
        .from('categories')
        .select('id, name, icon, slug, sort_order, short_description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      const categoriesResult = categoriesWithOrder.error?.message.toLowerCase().includes('sort_order')
        ? await client.from('categories').select('id, name, icon, slug, short_description').eq('is_active', true).order('name', { ascending: true })
        : categoriesWithOrder;

      if (categoriesResult.error) {
        console.error('Error cargando categorías:', categoriesResult.error);
        setCategories([]);
        setError(categoriesResult.error.message);
        return;
      }
      const nextCategories = normalizeOfficialCategoryRows((categoriesResult.data ?? []) as CategoryOption[])
        .filter((category) => category.displayOrder >= 1 && category.displayOrder <= 24)
        .slice(0, 24) as CategoryOption[];
      console.log('Categorías cargadas:', nextCategories.length, nextCategories[0]);
      setCategories(nextCategories);
      setCategoryId((current) => current || nextCategories[0]?.id || '');
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

  const parsedContacts = useMemo(() => text.split('\n').map(parseLine).filter((line) => line.raw), [text]);
  const validContacts = parsedContacts.filter((line) => line.valid);
  const invalidContacts = parsedContacts.filter((line) => !line.valid);
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;
  const canImport = Boolean(selectedCategory?.id) && validContacts.length > 0 && !isImporting;

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

    if (!selectedCategory?.id) {
      toast.error('Selecciona una categoría válida.');
      return;
    }

    if (!validContacts.length) {
      const noValidError = 'No hay contactos válidos para importar.';
      setResult(noValidError);
      console.log('CONTACTHUB_DEBUG_IMPORT', { selectedCategory, parsedContacts, insertedCount: 0, error: noValidError });
      return;
    }

    console.log('IMPORT_CATEGORY_SELECTED', selectedCategory);
    setIsImporting(true);
    let insertedCount = 0;
    const failedRows: Array<{ line: string; error: string }> = [];
    const insertedContacts: Array<{ id: string; name: string; phone: string; category_id: string; status: string }> = [];

    try {
      const importChunks = chunks(validContacts, 50);

      for (let index = 0; index < importChunks.length; index += 1) {
        const currentChunk = importChunks[index];
        setProgress(`Insertando lote ${index + 1} de ${importChunks.length}...`);

        const rows = currentChunk.map((contact) => {
          const country = countryFromPhone(contact.phone);
          return {
            category_id: selectedCategory.id,
            subcategory_id: null,
            name: sanitizeText(contact.name, 160),
            description: contact.name,
            phone: sanitizePhone(contact.phone),
            phone_masked: maskPhone(contact.phone),
            country_code: country.countryCode,
            country_flag: country.countryFlag,
            tags: [],
            source: 'importador admin',
            status: 'active' as const,
            risk_level: 'safe' as const,
          };
        });

        const { data, error: insertError } = await client.from('contacts').insert(rows).select('id,name,phone,category_id,status');
        if (insertError) {
          failedRows.push(...currentChunk.map((contact) => ({ line: contact.raw, error: insertError.message })));
          console.error('Error insertando lote de contactos:', insertError);
        } else {
          const savedRows = data ?? [];
          const wrongCategory = savedRows.find((contact) => contact.category_id !== selectedCategory.id || !contact.category_id);
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

      console.log('CONTACTHUB_IMPORT_VERIFY', {
        selectedCategory,
        insertedContacts,
        verifyCount: verifyContacts.length,
        verifyContacts,
      });

      if (insertedCount === 0) {
        setResult(failedRows.length ? `No se importó ningún contacto. Error: ${failedRows[0].error}` : 'No se importó ningún contacto.');
      } else if (failedRows.length) {
        setResult(`${insertedCount} contactos importados. ${failedRows.length} líneas fallaron. Contactos guardados en: ${selectedCategory.name}.`);
      } else {
        setResult(`${insertedCount} contactos importados correctamente. Contactos guardados en: ${selectedCategory.name}.`);
      }
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'No se pudo importar.';
      setResult(`No se pudo importar: ${message}`);
      console.error('Error importando contactos:', importError);
      console.log('CONTACTHUB_DEBUG_IMPORT', { selectedCategory, parsedContacts, insertedCount, error: message });
    } finally {
      setProgress('');
      setIsImporting(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando importador" message="Preparando categorías reales desde Supabase." />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="mx-auto w-full max-w-7xl rounded-2xl border border-line bg-panel px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Importar contactos</h2>
            <p className="mt-2 text-sm text-gray-400">Pega una lista, revisa la vista previa y guarda solo los contactos válidos.</p>
          </div>
          <button type="button" onClick={loadCategories} className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold text-white hover:border-brand-400/35">
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

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
          <div className="w-full space-y-4">
            <div ref={categoryPickerRef} className="relative grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Categoría destino</span>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen((current) => !current)}
                className="focus-ring flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-left text-sm font-semibold text-white hover:border-brand-400/45"
                aria-expanded={isCategoryPickerOpen}
              >
                <span className="min-w-0 truncate">{selectedCategory?.displayLabel ?? 'Selecciona una carpeta...'}</span>
                <span className="shrink-0 text-brand-300">{isCategoryPickerOpen ? '▲' : '▼'}</span>
              </button>
              {isCategoryPickerOpen ? (
                <div className="absolute left-0 right-0 top-[76px] z-30 max-h-[380px] overflow-y-auto rounded-2xl border border-brand-400/25 bg-ink-950/95 p-2 shadow-2xl shadow-black/40">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(category.id);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`focus-ring flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                        categoryId === category.id ? 'bg-brand-400/20 text-white ring-1 ring-brand-400/40' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="mt-0.5 w-6 shrink-0 text-center text-lg">{category.displayIcon}</span>
                      <span className="min-w-0">
                        <span className="block font-bold leading-snug">
                          {String(category.displayOrder).padStart(2, '0')}. {category.displayTitle}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">{category.displaySubtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line bg-ink-950/50 p-4 text-sm leading-6 text-gray-300">
              <p className="font-semibold text-white">Destino: {selectedCategory?.displayLabel ?? 'Selecciona una categoría'}</p>
              {selectedCategory?.id ? <p className="mt-1 truncate text-xs text-gray-500">{selectedCategory.id}</p> : null}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-2xl font-bold text-brand-400">{validContacts.length}</p>
                  <p className="text-xs text-gray-500">válidos</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-2xl font-bold text-amber-200">{invalidContacts.length}</p>
                  <p className="text-xs text-gray-500">ignorados</p>
                </div>
              </div>
              {realSavedCount !== null ? <p className="mt-4 text-brand-300">Ahora hay {realSavedCount} contactos reales en esta categoría.</p> : null}
            </div>

            <button
              type="button"
              disabled={!canImport}
              onClick={() => void importContacts()}
              className={`focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                canImport ? 'bg-brand-400 text-ink-950 hover:bg-brand-300' : 'cursor-not-allowed bg-white/10 text-gray-500'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              {validContacts.length ? `Importar ${validContacts.length} contactos` : 'No hay contactos válidos'}
            </button>

            {progress ? <p className="text-sm text-brand-400">{progress}</p> : null}
            {result ? <p className="rounded-lg border border-line bg-ink-950/50 p-4 text-sm font-semibold text-white">{result}</p> : null}
          </div>

          <div className="grid w-full min-w-0 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-300">Contactos</span>
              <textarea
                value={text}
                onChange={(event) => {
                  setText(sanitizeTextInput(event.target.value, 20000));
                  setResult('');
                  setFailed([]);
                  setRealSavedCount(null);
                }}
                rows={13}
                placeholder={'Pega aquí tus contactos, uno por línea.\nEjemplo:\nPack Minero +51 915 151 528\nVender PDFs de Alto Curso +51 998 801 893'}
                className="focus-ring min-h-[320px] w-full resize-y rounded-2xl border border-line bg-ink-950/70 px-4 py-3 font-mono text-sm text-white"
              />
            </label>

            <div className="max-h-[360px] overflow-auto rounded-xl border border-line">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-ink-950/70 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Teléfono formateado</th>
                    <th className="px-4 py-3">Línea original</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedContacts.map((line, index) => (
                    <tr key={`${line.raw}-${index}`} className={`border-t border-line ${line.valid ? '' : 'bg-red-500/10'}`}>
                      <td className={`px-4 py-3 font-bold ${line.valid ? 'text-brand-400' : 'text-red-200'}`}>{line.valid ? '✓' : '✕'}</td>
                      <td className="px-4 py-3 text-white">{line.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{line.phone || line.error}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{line.raw}</td>
                    </tr>
                  ))}
                  {!parsedContacts.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
