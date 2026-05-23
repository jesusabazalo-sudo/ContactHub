import { sanitizePhone, sanitizeText } from '../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export type ContactStatus = 'active' | 'inactive' | 'review' | 'rejected';
export type ContactRiskLevel = 'safe' | 'review' | 'prohibited';

export const getFlag = (phone: string): string => {
  if (phone.startsWith('+51')) return '🇵🇪';
  if (phone.startsWith('+1')) return '🇺🇸';
  if (phone.startsWith('+57')) return '🇨🇴';
  if (phone.startsWith('+52')) return '🇲🇽';
  if (phone.startsWith('+54')) return '🇦🇷';
  if (phone.startsWith('+55')) return '🇧🇷';
  if (phone.startsWith('+56')) return '🇨🇱';
  if (phone.startsWith('+591')) return '🇧🇴';
  if (phone.startsWith('+593')) return '🇪🇨';
  if (phone.startsWith('+595')) return '🇵🇾';
  if (phone.startsWith('+598')) return '🇺🇾';
  if (phone.startsWith('+34')) return '🇪🇸';
  if (phone.startsWith('+86')) return '🇨🇳';
  if (phone.startsWith('+20')) return '🇪🇬';
  return '🌎';
};

export const getCountryCode = (phone: string): string => {
  if (phone.startsWith('+51')) return 'PE';
  if (phone.startsWith('+1')) return 'US';
  if (phone.startsWith('+57')) return 'CO';
  if (phone.startsWith('+52')) return 'MX';
  if (phone.startsWith('+54')) return 'AR';
  if (phone.startsWith('+55')) return 'BR';
  if (phone.startsWith('+56')) return 'CL';
  if (phone.startsWith('+591')) return 'BO';
  if (phone.startsWith('+593')) return 'EC';
  if (phone.startsWith('+595')) return 'PY';
  if (phone.startsWith('+598')) return 'UY';
  if (phone.startsWith('+34')) return 'ES';
  if (phone.startsWith('+86')) return 'CN';
  if (phone.startsWith('+20')) return 'EG';
  return 'XX';
};

export async function getContacts(filters?: { search?: string; categoryId?: string; status?: string; page?: number }) {
  if (!supabase || !isSupabaseConfigured) return [];
  const page = filters?.page ?? 0;
  const pageSize = 50;
  let query = supabase
    .from('contacts')
    .select('id,name,phone,phone_masked,status,created_at,category_id,description,tags,risk_level,country_flag,country_code')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const safeSearch = sanitizeText(filters?.search ?? '', 80);
  if (safeSearch) query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  if (filters?.categoryId && filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status as ContactStatus);

  const { data, error } = await query;
  if (error) {
    console.error('getContacts:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getTotalContactsCount(filters?: { search?: string; categoryId?: string; status?: string }) {
  if (!supabase || !isSupabaseConfigured) return 0;
  let query = supabase.from('contacts').select('id', { count: 'exact', head: true });
  const safeSearch = sanitizeText(filters?.search ?? '', 80);
  if (safeSearch) query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  if (filters?.categoryId && filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status as ContactStatus);
  const { count, error } = await query;
  if (error) {
    console.error('getTotalContactsCount:', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function importContacts(contacts: Array<{ name: string; phone: string; category_id: string; description?: string; country_flag?: string; country_code?: string }>) {
  if (!supabase || !isSupabaseConfigured) return { inserted: 0, failed: contacts.map((contact) => contact.name) };
  const prepared = contacts.map((contact) => {
    const phone = sanitizePhone(contact.phone);
    return {
      name: sanitizeText(contact.name, 160),
      phone,
      phone_masked: phone.replace(/\d(?=\d{4})/g, '•'),
      category_id: contact.category_id,
      description: sanitizeText(contact.description ?? '', 500),
      country_flag: contact.country_flag ?? getFlag(phone),
      country_code: contact.country_code ?? getCountryCode(phone),
      tags: [],
      status: 'active' as const,
      risk_level: 'safe' as const,
      source: 'manual_import',
    };
  });

  const chunks: typeof prepared[] = [];
  for (let i = 0; i < prepared.length; i += 50) chunks.push(prepared.slice(i, i + 50));
  let inserted = 0;
  const failed: string[] = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const { error } = await supabase.from('contacts').insert(chunks[i]);
    if (error) {
      console.error(`Lote ${i + 1} fallo:`, error.message);
      failed.push(...chunks[i].map((contact) => contact.name));
    } else {
      inserted += chunks[i].length;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
  return { inserted, failed };
}

export async function deleteContact(id: string) {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) {
    console.error('deleteContact:', error.message);
    return false;
  }
  return true;
}

export async function deleteContactsBulk(ids: string[]) {
  if (!supabase || !isSupabaseConfigured || !ids.length) return false;
  const { error } = await supabase.from('contacts').delete().in('id', ids);
  if (error) {
    console.error('deleteContactsBulk:', error.message);
    return false;
  }
  return true;
}

export async function updateContact(id: string, updates: Record<string, unknown>) {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.error('updateContact:', error.message);
    return false;
  }
  return true;
}

export async function getAdminContactOptions() {
  if (!supabase || !isSupabaseConfigured) return { categories: [], subcategories: [] };
  const [categoriesRes, subcategoriesRes] = await Promise.all([
    supabase.from('categories').select('id,name,is_active,sort_order').order('sort_order', { ascending: true }),
    supabase.from('subcategories').select('id,category_id,name').order('name', { ascending: true }),
  ]);
  if (categoriesRes.error) console.error('getAdminContactOptions categories:', categoriesRes.error.message);
  if (subcategoriesRes.error) console.error('getAdminContactOptions subcategories:', subcategoriesRes.error.message);
  return {
    categories: categoriesRes.data ?? [],
    subcategories: subcategoriesRes.data ?? [],
  };
}

export const getAdminContacts = getContacts;

export async function createAdminContact(values: Record<string, any>) {
  if (!supabase || !isSupabaseConfigured) return false;
  const phone = sanitizePhone(values.phone ?? '');
  const { error } = await supabase.from('contacts').insert({
    category_id: values.categoryId ?? values.category_id,
    name: values.name ?? values.description ?? 'Contacto',
    description: values.description ?? values.name ?? '',
    phone,
    phone_masked: values.phoneMasked ?? values.phone_masked ?? phone.replace(/\d(?=\d{4})/g, '•'),
    country_flag: values.countryFlag ?? values.country_flag ?? getFlag(phone),
    country_code: values.countryCode ?? values.country_code ?? getCountryCode(phone),
    tags: values.tags ?? [],
    source: values.source ?? 'manual',
    status: values.status ?? 'active',
    risk_level: values.riskLevel ?? values.risk_level ?? 'safe',
  });
  if (error) console.error('createAdminContact:', error.message);
  return !error;
}

export async function updateAdminContact(contactId: string, values: Record<string, any>) {
  return updateContact(contactId, values);
}

export async function deactivateAdminContact(contactId: string) {
  return updateContact(contactId, { status: 'inactive' });
}

export async function deleteAdminContact(contactId: string) {
  return deleteContact(contactId);
}

export async function analyzeQuickBatchContacts() {
  return [];
}

export async function importValidBatchContacts() {
  return { inserted: 0, failed: [] as string[] };
}

export async function createQuickBatchContacts() {
  return { inserted: 0, failed: [] as string[] };
}

export async function generateCategoryDescriptionFromContacts() {
  return { shortDescription: '', description: '', tags: [] as string[], contactTypes: [] as string[] };
}

export async function applyCategoryAutomaticDescription() {
  return { shortDescription: '', description: '', tags: [] as string[], contactTypes: [] as string[] };
}
