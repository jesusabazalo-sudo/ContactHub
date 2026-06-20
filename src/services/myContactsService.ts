import { supabase } from '../lib/supabaseClient';
import { applyOfficialCategoryDisplay, sortByOfficialOrder } from '../data/officialCategories';

export type UnlockedFolder = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  contactsCount: number;
  sortOrder?: number | null;
  icon?: string | null;
};

export type UnlockedContact = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  phone: string;
  phoneMasked: string;
  countryFlag: string | null;
  countryCode: string | null;
  tags: string[];
};

export type MyContactsData = {
  folders: UnlockedFolder[];
  categories: UnlockedFolder[];
  contacts: UnlockedContact[];
  accessHistory: UnlockedAccess[];
  totalUnlocked: number;
};

export type UnlockedAccess = {
  categoryId: string;
  status: string;
  createdAt: string | null;
  accessType: string;
  source: string | null;
  note: string | null;
};

type UserAccessRow = {
  category_id: string | null;
  status?: string | null;
  created_at?: string | null;
  access_type?: string | null;
  source?: string | null;
  note?: string | null;
};

const EMPTY_MY_CONTACTS: MyContactsData = {
  folders: [],
  categories: [],
  contacts: [],
  accessHistory: [],
  totalUnlocked: 0,
};

function logQueryError(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  if (!import.meta.env.DEV) return;
  console.error(`[myContactsService:${scope}]`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export async function getMyContactsData(userId: string): Promise<MyContactsData> {
  if (!supabase) {
    throw new Error('Supabase no esta configurado para consultar tus accesos.');
  }

  let { data: accesses, error: accessError } = (await (supabase
    .from('user_category_access')
    .select('category_id, status, created_at, access_type, source, note')
    .eq('user_id', userId)
    .eq('status', 'active') as any)) as { data: UserAccessRow[] | null; error: any };

  if (accessError && /column|schema cache|access_type|source|note/i.test(accessError.message ?? '')) {
    const fallback = (await (supabase
      .from('user_category_access')
      .select('category_id, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'active') as any)) as { data: UserAccessRow[] | null; error: any };
    accesses = fallback.data;
    accessError = fallback.error;
  }

  if (accessError) {
    logQueryError('access', accessError);
    throw new Error('No pudimos leer tus accesos activos. Revisa la politica RLS de user_category_access.');
  }

  if (!accesses || accesses.length === 0) {
    if (import.meta.env.DEV) {
      console.debug('[myContactsService] active accesses', {
        sessionUserId: userId,
        activeAccessCount: 0,
        categoryIds: [],
      });
    }
    return EMPTY_MY_CONTACTS;
  }

  const categoryIds = [...new Set(accesses.map((access) => access.category_id).filter((categoryId): categoryId is string => Boolean(categoryId)))];
  if (!categoryIds.length) {
    throw new Error('Tus accesos activos no tienen una carpeta valida vinculada.');
  }
  const [catsRes, contactsRes] = await Promise.all([
    supabase.from('categories').select('id, name, icon, slug, description, short_description, tags').in('id', categoryIds),
    supabase.from('contact_unlocked_secure').select('*').in('category_id', categoryIds).limit(5000),
  ]);

  if (catsRes.error) {
    logQueryError('categories', catsRes.error);
    throw new Error('No se pudieron confirmar tus carpetas desbloqueadas.');
  }
  if (contactsRes.error) {
    logQueryError('contacts', contactsRes.error);
    throw new Error('Tus carpetas están activas, pero no se pudieron cargar sus contactos.');
  }
  const resolvedCategoryIds = new Set((catsRes.data ?? []).map((category) => category.id));
  if (categoryIds.some((categoryId) => !resolvedCategoryIds.has(categoryId))) {
    throw new Error('Hay un acceso activo que no está vinculado a una carpeta válida.');
  }

  const contacts = (contactsRes.data ?? []).map((contact) => ({
    id: contact.id,
    categoryId: contact.category_id,
    name: contact.name ?? '',
    description: contact.description ?? '',
    phone: contact.phone ?? '',
    phoneMasked: contact.phone_masked ?? '',
    countryFlag: contact.country_flag ?? null,
    countryCode: contact.country_code ?? null,
    tags: contact.tags ?? [],
  }));

  const countByCategory = new Map<string, number>();
  for (const contact of contacts) countByCategory.set(contact.categoryId, (countByCategory.get(contact.categoryId) ?? 0) + 1);

  const folders = sortByOfficialOrder(catsRes.data ?? []).map((category) => {
    const official = applyOfficialCategoryDisplay(category) as any;
    return {
      id: category.id,
      name: official.name,
      slug: category.slug,
      icon: official.icon,
      sortOrder: official.sortOrder,
      description: official.description ?? official.shortDescription ?? '',
      shortDescription: official.shortDescription ?? '',
      contactsCount: countByCategory.get(category.id) ?? 0,
    };
  });

  if (import.meta.env.DEV) {
    console.debug('[myContactsService] resolved access', {
      sessionUserId: userId,
      activeAccessCount: accesses.length,
      uniqueCategoryCount: categoryIds.length,
      categoryIds,
      resolvedFolders: folders.map((folder) => ({ id: folder.id, name: folder.name })),
      visibleContactsCount: contacts.length,
    });
  }

  return {
    folders,
    categories: folders,
    contacts,
    accessHistory: (accesses ?? []).filter((access): access is UserAccessRow & { category_id: string } => Boolean(access.category_id)).map((access) => ({
      categoryId: access.category_id,
      status: access.status ?? 'active',
      createdAt: access.created_at ?? null,
      accessType: access.access_type ?? 'manual',
      source: access.source ?? null,
      note: access.note ?? null,
    })),
    totalUnlocked: folders.length,
  };
}

export async function getTrialContacts(userId: string) {
  if (!supabase) return { used: false, contacts: [] };
  const { data: claim, error } = await supabase.from('trial_claims').select('contact_ids, claimed_at').eq('user_id', userId).maybeSingle();
  if (error || !claim) {
    if (error) console.error('getTrialContacts:', error.message);
    return { used: false, contacts: [] };
  }

  const contactIds = claim.contact_ids ?? [];
  if (!contactIds.length) return { used: true, contacts: [], claimedAt: claim.claimed_at };

  // Leer desde la vista segura (no del teléfono crudo de `contacts`). La vista ya
  // restringe a los contactos de prueba/recompensa del propio usuario por RLS.
  const { data: contacts, error: contactsError } = await supabase
    .from('contact_trial_secure')
    .select('id, name, phone, description, category_id, country_flag')
    .in('id', contactIds);
  if (contactsError) console.error('getTrialContacts contacts:', contactsError.message);

  return { used: true, contacts: contacts ?? [], claimedAt: claim.claimed_at };
}
