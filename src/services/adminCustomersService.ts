import { sanitizeText } from '../lib/sanitize';
import { supabase } from '../lib/supabaseClient';

export type CustomerStatus = 'nuevo' | 'pendiente' | 'activo' | 'vip' | 'bloqueado';
export type CustomerStatusFilter = 'todos' | CustomerStatus;
export type FeedbackStatus = 'pending' | 'approved' | 'hidden';

export type CustomerListItem = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  status: CustomerStatus;
  unlockedFolderCount: number;
  usedFreeTrial: boolean;
  lastActivity: string | null;
};

export type CustomerDetail = CustomerListItem & {
  notes: Array<{ id: string; note: string; createdAt: string }>;
  accesses: Array<{ id: string; categoryId: string; categoryName: string; status: 'active' | 'revoked'; planName: string | null; grantedAt: string }>;
  purchases: Array<{ id: string; status: string; planName: string | null; categoryName: string | null; notes: string | null; createdAt: string; grantedAt: string | null }>;
  rewards: Array<{ id: string; rewardType: string; quantity: number; reason: string; createdAt: string }>;
  supportMessages: Array<{ id: string; message: string; sessionId: string; createdAt: string }>;
  feedback: Array<{ id: string; name: string; comment: string; rating: number; status: FeedbackStatus; rewardGranted: boolean; createdAt: string }>;
  categories: Array<{ id: string; name: string }>;
};

export type CustomerFilters = { search: string; status: CustomerStatusFilter };

function emptyCustomer(id: string): CustomerDetail {
  return {
    id,
    email: null,
    fullName: null,
    phone: null,
    createdAt: '',
    status: 'nuevo',
    unlockedFolderCount: 0,
    usedFreeTrial: false,
    lastActivity: null,
    notes: [],
    accesses: [],
    purchases: [],
    rewards: [],
    supportMessages: [],
    feedback: [],
    categories: [],
  };
}

export async function getCustomers(filters?: CustomerFilters) {
  if (!supabase) return [];
  const client = supabase;
  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, email, full_name, phone, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getCustomers:', error.message);
    return [];
  }

  const result = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const [statusRes, accessRes, trialRes] = await Promise.all([
        client.from('customer_status').select('status').eq('user_id', p.id).maybeSingle(),
        client.from('user_category_access').select('id', { count: 'exact', head: true }).eq('user_id', p.id).eq('status', 'active'),
        client.from('trial_claims').select('id').eq('user_id', p.id).maybeSingle(),
      ]);

      if (statusRes.error) console.error('getCustomers status:', statusRes.error.message);
      if (accessRes.error) console.error('getCustomers access:', accessRes.error.message);
      if (trialRes.error) console.error('getCustomers trial:', trialRes.error.message);

      return {
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        phone: p.phone,
        createdAt: p.created_at,
        status: (statusRes.data?.status ?? 'nuevo') as CustomerStatus,
        unlockedFolderCount: accessRes.count ?? 0,
        usedFreeTrial: !!trialRes.data,
        lastActivity: p.updated_at ?? p.created_at,
        active_folders: accessRes.count ?? 0,
        trial_used: !!trialRes.data,
      };
    }),
  );

  const search = sanitizeText(filters?.search ?? '', 80).toLowerCase();
  return result.filter((customer) => {
    const matchesSearch = search ? [customer.email ?? '', customer.fullName ?? '', customer.phone ?? ''].join(' ').toLowerCase().includes(search) : true;
    const matchesStatus = !filters || filters.status === 'todos' || customer.status === filters.status;
    return matchesSearch && matchesStatus;
  });
}

export async function updateCustomerStatus(userId: string, status: string) {
  if (!supabase) return false;
  const safeStatus = (['nuevo', 'pendiente', 'activo', 'vip', 'bloqueado'].includes(status) ? status : 'nuevo') as CustomerStatus;
  const { error } = await supabase.from('customer_status').upsert({ user_id: userId, status: safeStatus, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.error('updateCustomerStatus:', error.message);
  return !error;
}

export const setCustomerStatus = updateCustomerStatus;

export async function getCustomerNotes(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('customer_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error('getCustomerNotes:', error.message);
    return [];
  }
  return data ?? [];
}

export async function addCustomerNote(userId: string, note: string, createdBy: string) {
  if (!supabase) return false;
  const { error } = await supabase.from('customer_notes').insert({ user_id: userId, note: sanitizeText(note, 1000), created_by: createdBy });
  if (error) console.error('addCustomerNote:', error.message);
  return !error;
}

export async function getCustomerRewards(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('customer_rewards').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error('getCustomerRewards:', error.message);
    return [];
  }
  return data ?? [];
}

export async function addCustomerReward(userId: string, rewardType: string, quantity: number, reason: string, grantedBy: string) {
  if (!supabase) return false;
  const { error } = await supabase.from('customer_rewards').insert({ user_id: userId, reward_type: sanitizeText(rewardType, 80), quantity, reason: sanitizeText(reason, 500), granted_by: grantedBy });
  if (error) console.error('addCustomerReward:', error.message);
  return !error;
}

export async function grantCustomerReward(params: { userId: string; adminUserId: string; quantity: number; reason: string; rewardType?: string }) {
  return addCustomerReward(params.userId, params.rewardType ?? 'extra_contacts', params.quantity, params.reason, params.adminUserId);
}

export async function getCustomerFeedback() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('customer_feedback').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('getCustomerFeedback:', error.message);
    return [];
  }
  return data ?? [];
}

export async function grantFolderGift(userId: string, categoryIds: string[], reason: string, grantedBy: string) {
  if (!supabase) return false;
  const rows = categoryIds.map((cid) => ({ user_id: userId, category_id: cid, granted_by: grantedBy, status: 'active' as const }));
  const { error } = await supabase.from('user_category_access').upsert(rows, { onConflict: 'user_id,category_id' });
  if (error) {
    console.error('grantFolderGift:', error.message);
    return false;
  }

  for (const cid of categoryIds) {
    const { data: cat, error: catError } = await supabase.from('categories').select('name').eq('id', cid).maybeSingle();
    if (catError) console.error('grantFolderGift category:', catError.message);
    const { error: chatError } = await supabase.from('chat_messages').insert({
      user_id: userId,
      sender: 'admin',
      session_id: `gift-${userId}`,
      message: `¡Hola! Te acabo de regalar acceso a ${cat?.name ?? 'una carpeta'} 🎁 Espero que te sea útil. Cualquier cosa me avisas.`,
      read: false,
    });
    if (chatError) console.error('grantFolderGift chat:', chatError.message);
  }

  if (reason) {
    const { error: rewardError } = await supabase.from('customer_rewards').insert({
      user_id: userId,
      reward_type: 'folder_gift',
      quantity: categoryIds.length,
      reason,
      granted_by: grantedBy,
    });
    if (rewardError) console.error('grantFolderGift reward:', rewardError.message);
  }
  return true;
}

export async function getCustomerDetail(userId: string): Promise<CustomerDetail> {
  if (!supabase) return emptyCustomer(userId);
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,email,full_name,phone,created_at,updated_at').eq('id', userId).maybeSingle();
  if (profileError || !profile) {
    if (profileError) console.error('getCustomerDetail:', profileError.message);
    return emptyCustomer(userId);
  }

  const [notes, rewards, feedbackRes, categoriesRes, accessRes, purchaseRes, messageRes, trialRes] = await Promise.all([
    getCustomerNotes(userId),
    getCustomerRewards(userId),
    supabase.from('customer_feedback').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('categories').select('id,name').eq('is_active', true).order('name'),
    supabase.from('user_category_access').select('id,category_id,status,created_at,updated_at').eq('user_id', userId),
    supabase.from('purchases').select('id,status,notes,created_at,granted_at,category_id,plan_id').eq('user_id', userId),
    supabase.from('chat_messages').select('id,message,session_id,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('trial_claims').select('id').eq('user_id', userId).maybeSingle(),
  ]);

  if (feedbackRes.error) console.error('getCustomerDetail feedback:', feedbackRes.error.message);
  if (categoriesRes.error) console.error('getCustomerDetail categories:', categoriesRes.error.message);
  if (accessRes.error) console.error('getCustomerDetail access:', accessRes.error.message);
  if (purchaseRes.error) console.error('getCustomerDetail purchases:', purchaseRes.error.message);
  if (messageRes.error) console.error('getCustomerDetail messages:', messageRes.error.message);

  const categories = categoriesRes.data ?? [];
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const accesses = accessRes.data ?? [];

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    createdAt: profile.created_at,
    status: accesses.some((access) => access.status === 'active') ? 'activo' : 'nuevo',
    unlockedFolderCount: accesses.filter((access) => access.status === 'active').length,
    usedFreeTrial: Boolean(trialRes.data),
    lastActivity: profile.updated_at ?? profile.created_at,
    categories,
    accesses: accesses.map((access) => ({
      id: access.id,
      categoryId: access.category_id,
      categoryName: categoryById.get(access.category_id) ?? 'Carpeta sin nombre',
      status: access.status,
      planName: null,
      grantedAt: access.updated_at ?? access.created_at,
    })),
    purchases: (purchaseRes.data ?? []).map((purchase) => ({
      id: purchase.id,
      status: purchase.status,
      planName: null,
      categoryName: purchase.category_id ? categoryById.get(purchase.category_id) ?? null : null,
      notes: purchase.notes,
      createdAt: purchase.created_at,
      grantedAt: purchase.granted_at,
    })),
    rewards: (rewards ?? []).map((reward: any) => ({ id: reward.id, rewardType: reward.reward_type, quantity: reward.quantity, reason: reward.reason, createdAt: reward.created_at })),
    notes: (notes ?? []).map((note: any) => ({ id: note.id, note: note.note, createdAt: note.created_at })),
    supportMessages: (messageRes.data ?? []).map((message) => ({ id: message.id, message: message.message, sessionId: message.session_id, createdAt: message.created_at })),
    feedback: (feedbackRes.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      comment: item.comment,
      rating: item.rating,
      status: item.status,
      rewardGranted: item.reward_granted,
      createdAt: item.created_at,
    })),
  };
}

export async function approveFeedbackAndGrantReward(params: { userId: string; feedbackId: string; adminUserId: string }) {
  if (!supabase) return false;
  const { error } = await supabase.from('customer_feedback').update({ status: 'approved', reward_granted: true }).eq('id', params.feedbackId).eq('user_id', params.userId);
  if (error) {
    console.error('approveFeedbackAndGrantReward:', error.message);
    return false;
  }
  return grantCustomerReward({ userId: params.userId, adminUserId: params.adminUserId, quantity: 3, reason: 'Comentario aprobado por admin.', rewardType: 'extra_contacts' });
}

export async function activateCustomerCategory(params: { email: string; categoryId: string; adminUserId: string }) {
  if (!supabase) return false;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id').ilike('email', params.email.trim().toLowerCase()).maybeSingle();
  if (profileError || !profile) {
    if (profileError) console.error('activateCustomerCategory:', profileError.message);
    return false;
  }
  return grantFolderGift(profile.id, [params.categoryId], 'Acceso activado desde clientes.', params.adminUserId);
}

export async function revokeCustomerAccess(params: { userId: string; categoryId: string; adminUserId: string }) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('user_category_access')
    .update({ status: 'revoked', granted_by: params.adminUserId, updated_at: new Date().toISOString() })
    .eq('user_id', params.userId)
    .eq('category_id', params.categoryId);
  if (error) console.error('revokeCustomerAccess:', error.message);
  return !error;
}
