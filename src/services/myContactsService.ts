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
  totalUnlocked: number;
};

export async function getMyContactsData(userId: string): Promise<MyContactsData> {
  if (!supabase) return { folders: [], categories: [], contacts: [], totalUnlocked: 0 };
  const { data: accesses, error: accessError } = await supabase.from('user_category_access').select('category_id').eq('user_id', userId).eq('status', 'active');

  if (accessError) {
    console.error('getMyContactsData access:', accessError.message);
    return { folders: [], categories: [], contacts: [], totalUnlocked: 0 };
  }

  if (!accesses || accesses.length === 0) {
    return { folders: [], categories: [], contacts: [], totalUnlocked: 0 };
  }

  const categoryIds = accesses.map((a) => a.category_id);
  const [catsRes, contactsRes] = await Promise.all([
    supabase.from('categories').select('id, name, icon, slug, description, short_description, sort_order, tags').in('id', categoryIds),
    supabase.from('contact_unlocked_secure').select('*').in('category_id', categoryIds).limit(1000),
  ]);

  if (catsRes.error) console.error('getMyContactsData categories:', catsRes.error.message);
  if (contactsRes.error) console.error('getMyContactsData contacts:', contactsRes.error.message);

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

  return {
    folders,
    categories: folders,
    contacts,
    totalUnlocked: contacts.length,
  };
}

export async function getTrialContacts(userId: string) {
  if (!supabase) return { used: false, contacts: [] };
  const { data: claim, error } = await supabase.from('trial_claims').select('contact_ids, claimed_at').eq('user_id', userId).maybeSingle();
  if (error || !claim) {
    if (error) console.error('getTrialContacts:', error.message);
    return { used: false, contacts: [] };
  }

  const { data: contacts, error: contactsError } = await supabase.from('contacts').select('id, name, phone, description, category_id, country_flag').in('id', claim.contact_ids ?? []);
  if (contactsError) console.error('getTrialContacts contacts:', contactsError.message);

  return { used: true, contacts: contacts ?? [], claimedAt: claim.claimed_at };
}
