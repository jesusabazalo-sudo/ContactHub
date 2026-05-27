import { supabase } from '../lib/supabaseClient';
import { applyOfficialCategoryDisplay } from '../data/officialCategories';
import type { Category, PreviewContact } from '../types';

export type CatalogContact = {
  id: string;
  categoryId: string;
  category_id?: string;
  name: string;
  description: string;
  phone: string | null;
  phoneMasked: string;
  phone_masked?: string;
  countryFlag: string | null;
  country_flag?: string | null;
  countryCode: string | null;
  country_code?: string | null;
  tags: string[];
  createdAt: string;
  created_at?: string;
  isUnlocked: boolean;
};

function mapCategory(row: any, contactsCount = 0): Category {
  // Do not infer identity from the array position. Category identity must come
  // from the real row slug/name/sort_order so links and contact counts stay aligned.
  const official = applyOfficialCategoryDisplay(row, -1);
  return {
    id: official.id,
    name: official.name ?? '',
    slug: official.slug ?? row.slug ?? '',
    icon: official.icon ?? 'Folder',
    description: official.description ?? '',
    shortDescription: official.shortDescription ?? official.short_description ?? '',
    contactsCount,
    sortOrder: official.sortOrder ?? official.sort_order ?? null,
    tags: official.tags ?? [],
    whatYouCanFind: official.whatYouCanFind ?? [],
    isPremiumOfficial: Boolean(official.isPremiumOfficial),
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    isTop: Boolean(row.is_top),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

function mapPreviewContact(row: any): PreviewContact {
  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    phone: row.phone ?? null,
    phoneMasked: row.phone_masked ?? '',
    countryFlag: row.country_flag ?? null,
    tags: row.tags ?? [],
  };
}

function mapContact(row: any, isUnlocked: boolean): CatalogContact {
  return {
    id: row.id,
    categoryId: row.category_id,
    category_id: row.category_id,
    name: row.name ?? '',
    description: row.description ?? '',
    phone: row.phone ?? null,
    phoneMasked: row.phone_masked ?? '',
    phone_masked: row.phone_masked ?? '',
    countryFlag: row.country_flag ?? null,
    country_flag: row.country_flag ?? null,
    countryCode: row.country_code ?? null,
    country_code: row.country_code ?? null,
    tags: row.tags ?? [],
    createdAt: row.created_at ?? '',
    created_at: row.created_at ?? '',
    isUnlocked,
  };
}

export async function getCatalogCategories() {
  try {
    if (!supabase) return [];
    const client = supabase;
    const { data, error } = await client.from('categories').select('*').eq('is_active', true).order('name', { ascending: true });
    if (error) {
      console.error('getCatalogCategories error:', error);
      return [];
    }

    const withCounts = await Promise.all(
      (data ?? []).map(async (cat) => {
        const { count, error: countError } = await client.from('contacts').select('id', { count: 'exact', head: true }).eq('category_id', cat.id).eq('status', 'active');
        if (countError) console.error('getCatalogCategories count:', countError.message);
        return mapCategory(cat, count ?? 0);
      }),
    );

    return withCounts.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name));
  } catch (err) {
    console.error('getCatalogCategories catch:', err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) {
    console.error('getCategoryBySlug:', error.message);
    return null;
  }
  return data ? mapCategory(data, 0) : null;
}

export async function getCategoryContacts(categoryId: string, hasAccess: boolean, isRegistered = false) {
  if (!supabase) return [];
  if (hasAccess) {
    const { data, error } = await supabase.from('contact_unlocked_secure').select('*').eq('category_id', categoryId).limit(200);
    if (!error && data) return data.map((row) => mapContact(row, true));
    if (error) console.error('getCategoryContacts unlocked:', error.message);
  }

  if (isRegistered) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, phone, phone_masked, description, category_id, country_flag, country_code, tags, status, created_at')
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .limit(200);
    if (!error && data) return data.map((row) => mapContact(row, false));
    if (error) console.error('getCategoryContacts registered preview:', error.message);
  }

  const { data: preview, error: previewError } = await supabase.from('contact_public_preview').select('*').eq('category_id', categoryId).limit(200);
  if (!previewError && preview) return preview.map((row) => mapContact(row, false));
  if (previewError) console.error('getCategoryContacts preview:', previewError.message);

  const { data: fallback, error: fallbackError } = await supabase
    .from('contacts')
    .select('id, name, phone_masked, description, category_id, country_flag, country_code, tags, status, created_at')
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .limit(200);
  if (fallbackError) {
    console.error('getCategoryContacts fallback:', fallbackError.message);
    return [];
  }
  return (fallback ?? []).map((row) => mapContact(row, false));
}

export async function checkUserCategoryAccess(userId: string | undefined, categoryId: string, isAdmin = false): Promise<boolean> {
  if (isAdmin) return true;
  if (!supabase || !userId) return false;
  const { data, error } = await supabase.from('user_category_access').select('id').eq('user_id', userId).eq('category_id', categoryId).eq('status', 'active').maybeSingle();
  if (error) return false;
  return !!data;
}

export async function checkUserTotalAccess(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.from('purchases').select('id, plans(is_total_access)').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (error) return false;
  return !!(data as any)?.plans?.is_total_access;
}

export async function getCategoryDetail(params: { slug: string; userId?: string; isAdmin: boolean }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return null;
  const totalAccess = params.userId ? await checkUserTotalAccess(params.userId) : false;
  const hasAccess = params.isAdmin || totalAccess || (await checkUserCategoryAccess(params.userId, category.id, params.isAdmin));
  const contacts = await getCategoryContacts(category.id, hasAccess, Boolean(params.userId));
  return { category: { ...category, contactsCount: contacts.length }, contacts, hasAccess };
}

export async function getCatalogCategoryPreviews(params: { categoryIds: string[]; isRegistered: boolean; fullAccessCategoryIds: Set<string> }) {
  if (!supabase || !params.categoryIds.length) return new Map<string, PreviewContact[]>();
  const client = supabase;

  const entries: Array<readonly [string, PreviewContact[]]> = await Promise.all(
    params.categoryIds.map(async (categoryId) => {
      const canReadFull = params.fullAccessCategoryIds.has(categoryId);

      if (canReadFull || params.isRegistered) {
        const { data, error } = await client
          .from('contacts')
          .select('id, name, phone, phone_masked, description, category_id, country_flag, tags')
          .eq('category_id', categoryId)
          .eq('status', 'active')
          .limit(3);
        if (!error && data) return [categoryId, data.map(mapPreviewContact)] as const;
        if (error) console.error('getCatalogCategoryPreviews contacts:', error.message);
      }

      const { data, error } = await client
        .from('contact_public_preview')
        .select('id, name, phone_masked, description, category_id, country_flag, tags')
        .eq('category_id', categoryId)
        .limit(3);
      if (error) {
        console.error('getCatalogCategoryPreviews public:', error.message);
        return [categoryId, [] as PreviewContact[]] as const;
      }
      return [categoryId, (data ?? []).map(mapPreviewContact)] as const;
    }),
  );

  return new Map(entries);
}
