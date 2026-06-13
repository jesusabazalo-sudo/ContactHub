import type { User } from '@supabase/supabase-js';
import { sanitizeEmail, sanitizePhone, sanitizeText } from './sanitize';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AutofillProfile = {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  displayName: string;
};

type ProfileRow = {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

export const emptyAutofillProfile: AutofillProfile = {
  userId: '',
  email: '',
  fullName: '',
  phone: '',
  whatsapp: '',
  displayName: '',
};

export function getAuthProfile(user: User | null | undefined): AutofillProfile {
  if (!user) return emptyAutofillProfile;
  const metadata = user.user_metadata ?? {};
  const fullName = sanitizeText(String(metadata.full_name ?? metadata.name ?? metadata.display_name ?? ''), 160);
  const phone = sanitizePhone(String(metadata.phone ?? metadata.whatsapp ?? ''));

  return {
    userId: user.id,
    email: sanitizeEmail(user.email ?? ''),
    fullName,
    phone,
    whatsapp: phone,
    displayName: sanitizeText(String(metadata.display_name ?? metadata.name ?? metadata.full_name ?? ''), 160),
  };
}

export function mergeAutofillProfile(base: AutofillProfile, profile?: ProfileRow | null): AutofillProfile {
  if (!profile) return base;
  const fullName = sanitizeText(profile.full_name ?? base.fullName, 160);
  const displayName = sanitizeText(profile.display_name ?? fullName ?? base.displayName, 160);
  const phone = sanitizePhone(profile.phone ?? base.phone);
  const whatsapp = sanitizePhone(profile.whatsapp ?? phone ?? base.whatsapp);

  return {
    userId: base.userId,
    email: sanitizeEmail(profile.email ?? base.email),
    fullName,
    phone,
    whatsapp,
    displayName,
  };
}

export async function readAutofillProfile(user: User): Promise<ProfileRow | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  const client = supabase as unknown as { from: (table: string) => any };

  const fullSelect = await client
    .from('profiles')
    .select('id,email,full_name,display_name,phone,whatsapp')
    .eq('id', user.id)
    .maybeSingle();

  if (!fullSelect.error) return (fullSelect.data ?? null) as ProfileRow | null;

  if (import.meta.env.DEV) console.warn('Autofill profile full select fallback:', fullSelect.error.message);

  const basicSelect = await client
    .from('profiles')
    .select('id,email,full_name,phone')
    .eq('id', user.id)
    .maybeSingle();

  if (basicSelect.error) {
    if (import.meta.env.DEV) console.warn('Autofill profile basic select:', basicSelect.error.message);
    return null;
  }

  return (basicSelect.data ?? null) as ProfileRow | null;
}

export async function ensureAutofillProfile(user: User | null | undefined) {
  if (!user || !supabase || !isSupabaseConfigured) return getAuthProfile(user);

  const client = supabase as unknown as { from: (table: string) => any };
  const base = getAuthProfile(user);
  const profile = await readAutofillProfile(user);
  const now = new Date().toISOString();

  try {
    if (!profile?.id) {
      const { error } = await client.from('profiles').insert({
        id: user.id,
        email: base.email,
        full_name: base.fullName || null,
        phone: base.phone || null,
        created_at: now,
        updated_at: now,
      });
      if (error && import.meta.env.DEV) console.warn('Autofill profile insert:', error.message);
      return base;
    }

    const updates: Record<string, string | null> = {
      email: profile.email || base.email || null,
      updated_at: now,
    };

    if (!profile.full_name && base.fullName) updates.full_name = base.fullName;
    if (!profile.phone && base.phone) updates.phone = base.phone;

    const { error } = await client.from('profiles').update(updates).eq('id', user.id);
    if (error && import.meta.env.DEV) console.warn('Autofill profile update:', error.message);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Autofill profile ensure failed:', error);
  }

  return mergeAutofillProfile(base, profile);
}
