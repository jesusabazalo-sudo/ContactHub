import { supabase } from './supabaseClient';

export type ContactActionType = 'view' | 'copy' | 'whatsapp';

export type RecentActivity = {
  id: string;
  contactId: string;
  contactName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  action: ContactActionType;
  createdAt: string;
};

/**
 * Registra copy/whatsapp para alimentar "Contactos recientes" y "Mis estadísticas".
 * Falla en silencio: la tabla `contact_views` (migración 034) puede no estar
 * aplicada todavía en el proyecto de Supabase del usuario.
 */
export async function recordContactAction(userId: string, contactId: string, action: ContactActionType) {
  if (!supabase || !userId || !contactId) return;
  try {
    await supabase.from('contact_views').insert({ user_id: userId, contact_id: contactId, action });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[activityTracking] no se pudo registrar la acción:', error);
  }
}

export async function getRecentActivity(userId: string, limit = 20): Promise<RecentActivity[]> {
  if (!supabase || !userId) return [];

  const { data: views, error: viewsError } = await supabase
    .from('contact_views')
    .select('id, contact_id, action, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (viewsError || !views?.length) {
    if (viewsError && import.meta.env.DEV) console.warn('[activityTracking] contact_views no disponible aún:', viewsError.message);
    return [];
  }

  const contactIds = [...new Set(views.map((view) => view.contact_id))];
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, name, category_id')
    .in('id', contactIds);

  if (contactsError || !contacts) return [];

  const categoryIds = [...new Set(contacts.map((contact) => contact.category_id))];
  const { data: categories } = await supabase.from('categories').select('id, name, icon').in('id', categoryIds);

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));

  return views
    .map((view) => {
      const contact = contactsById.get(view.contact_id);
      if (!contact) return null;
      const category = categoriesById.get(contact.category_id);
      return {
        id: view.id,
        contactId: view.contact_id,
        contactName: contact.name,
        categoryId: contact.category_id,
        categoryName: category?.name ?? '',
        categoryIcon: category?.icon ?? '📁',
        action: view.action,
        createdAt: view.created_at,
      } satisfies RecentActivity;
    })
    .filter((activity): activity is RecentActivity => activity !== null);
}
