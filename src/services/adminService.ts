import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { applyOfficialCategoryDisplay, sortByOfficialOrder } from '../data/officialCategories';

export type AdminProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'admin';
  activeAccessCount: number;
  customerStatus: 'nuevo' | 'pendiente' | 'activo' | 'vip' | 'bloqueado';
  usedTrial: boolean;
};

export type AdminCategory = { id: string; name: string; slug: string; contactsCount: number; isActive: boolean; sortOrder?: number | null; icon?: string | null; shortDescription?: string; tags?: string[]; whatYouCanFind?: string[] };
export type AdminUserAccess = { categoryId: string; categoryName: string; status: 'active' | 'revoked'; createdAt: string; updatedAt: string };
export type AdminFoundUser = { id: string; email: string | null; fullName: string | null; phone: string | null; createdAt: string; activeAccesses: AdminUserAccess[] };
export type AdminPlan = { id: string; name: string; price: number; folderLimit: number | null; isTotalAccess: boolean };
export type PendingPurchase = { id: string; userId: string; userEmail: string | null; planName: string | null; categoryName: string | null; planId: string | null; categoryId: string | null; createdAt: string; notes: string | null };
export type AdminActivity = { id: string; action: string; targetType: string | null; targetId: string | null; metadata: Record<string, unknown>; createdAt: string };
export type AdminDashboardData = { totalUsers: number; totalCategories: number; activeCategories: number; pendingPurchases: number; activeAccesses: number; recentActivity: AdminActivity[] };

const activationWhatsAppMessage = 'Listo, tu acceso a ContactHub ya fue activado. Entra con tu correo y podrás ver tus carpetas desbloqueadas.';

function ready() {
  return Boolean(supabase && isSupabaseConfigured);
}

export async function getDashboardStats() {
  if (!ready() || !supabase) return { total_users: 0, total_contacts: 0, total_active_access: 0, total_trials: 0, total_leads: 0 };
  const [usersRes, contactsRes, accessRes, trialRes, leadsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user_category_access').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('trial_claims').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);
  if (usersRes.error) console.error('getDashboardStats users:', usersRes.error.message);
  if (contactsRes.error) console.error('getDashboardStats contacts:', contactsRes.error.message);
  if (accessRes.error) console.error('getDashboardStats access:', accessRes.error.message);
  if (trialRes.error) console.error('getDashboardStats trials:', trialRes.error.message);
  if (leadsRes.error) console.error('getDashboardStats leads:', leadsRes.error.message);
  return {
    total_users: usersRes.count ?? 0,
    total_contacts: contactsRes.count ?? 0,
    total_active_access: accessRes.count ?? 0,
    total_trials: trialRes.count ?? 0,
    total_leads: leadsRes.count ?? 0,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!ready() || !supabase) return { totalUsers: 0, totalCategories: 0, activeCategories: 0, pendingPurchases: 0, activeAccesses: 0, recentActivity: [] };
  const [profilesResult, categoriesResult, pendingResult, accessesResult, activityResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id,is_active', { count: 'exact' }),
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('user_category_access').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('audit_logs').select('id,action,target_type,target_id,metadata,created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const firstError = profilesResult.error || categoriesResult.error || pendingResult.error || accessesResult.error || activityResult.error;
  if (firstError) console.error('getAdminDashboardData:', firstError.message);
  return {
    totalUsers: profilesResult.count ?? 0,
    totalCategories: categoriesResult.count ?? 0,
    activeCategories: categoriesResult.data?.filter((category) => category.is_active).length ?? 0,
    pendingPurchases: pendingResult.count ?? 0,
    activeAccesses: accessesResult.count ?? 0,
    recentActivity: (activityResult.data ?? []).map((item) => ({
      id: item.id,
      action: item.action,
      targetType: item.target_type,
      targetId: item.target_id,
      metadata: item.metadata,
      createdAt: item.created_at,
    })),
  };
}

export async function getAdminUsers(): Promise<AdminProfile[]> {
  if (!ready() || !supabase) return [];
  const [profilesResult, rolesResult, accessesResult, trialResult] = await Promise.all([
    supabase.from('profiles').select('id,email,full_name,phone,created_at,updated_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('user_roles').select('user_id,role'),
    supabase.from('user_category_access').select('user_id,status').eq('status', 'active'),
    supabase.from('trial_claims').select('user_id'),
  ]);
  const firstError = profilesResult.error || rolesResult.error || accessesResult.error || trialResult.error;
  if (firstError) {
    console.error('getAdminUsers:', firstError.message);
    return [];
  }
  const roleByUser = new Map((rolesResult.data ?? []).map((role) => [role.user_id, role.role]));
  const trialUsers = new Set((trialResult.data ?? []).map((trial) => trial.user_id));
  const accessCounts = new Map<string, number>();
  for (const access of accessesResult.data ?? []) accessCounts.set(access.user_id, (accessCounts.get(access.user_id) ?? 0) + 1);
  return (profilesResult.data ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    role: roleByUser.get(profile.id) ?? 'user',
    activeAccessCount: accessCounts.get(profile.id) ?? 0,
    customerStatus: (accessCounts.get(profile.id) ?? 0) > 0 ? 'activo' : trialUsers.has(profile.id) ? 'pendiente' : 'nuevo',
    usedTrial: trialUsers.has(profile.id),
  }));
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  if (!ready() || !supabase) return [];
  const client = supabase;
  const { data: cats, error } = await client.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('getAdminCategories:', error.message);
    return [];
  }
  const withCounts = await Promise.all(
    sortByOfficialOrder(cats ?? []).map(async (cat) => {
      const { count, error: countError } = await client.from('contacts').select('id', { count: 'exact', head: true }).eq('category_id', cat.id).eq('status', 'active');
      if (countError) console.error('getAdminCategories count:', countError.message);
      const official = applyOfficialCategoryDisplay(cat) as any;
      return {
        id: cat.id,
        name: official.name,
        slug: cat.slug,
        contactsCount: count ?? 0,
        isActive: cat.is_active,
        sortOrder: official.sortOrder,
        icon: official.icon,
        shortDescription: official.shortDescription,
        tags: official.tags,
        whatYouCanFind: official.whatYouCanFind,
        contacts_count: count ?? 0,
      };
    }),
  );
  return sortByOfficialOrder(withCounts);
}

export async function getAdminPlans(): Promise<AdminPlan[]> {
  if (!ready() || !supabase) return [];
  const { data, error } = await supabase.from('plans').select('id,name,price,folder_limit,is_total_access').order('price');
  if (error) {
    console.error('getAdminPlans:', error.message);
    return [];
  }
  return (data ?? []).map((plan) => ({ id: plan.id, name: plan.name, price: Number(plan.price), folderLimit: plan.folder_limit, isTotalAccess: plan.is_total_access }));
}

export async function getPendingPurchases(): Promise<PendingPurchase[]> {
  if (!ready() || !supabase) return [];
  const { data: purchases, error } = await supabase.from('purchases').select('id,user_id,plan_id,category_id,created_at,notes').eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
  if (error) {
    console.error('getPendingPurchases:', error.message);
    return [];
  }
  if (!purchases?.length) return [];
  const userIds = [...new Set(purchases.map((purchase) => purchase.user_id))];
  const planIds = [...new Set(purchases.map((purchase) => purchase.plan_id).filter(Boolean))] as string[];
  const categoryIds = [...new Set(purchases.map((purchase) => purchase.category_id).filter(Boolean))] as string[];
  const [profilesResult, plansResult, categoriesResult] = await Promise.all([
    supabase.from('profiles').select('id,email').in('id', userIds),
    planIds.length ? supabase.from('plans').select('id,name').in('id', planIds) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from('categories').select('id,name,slug,icon,sort_order').in('id', categoryIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesResult.error) console.error('getPendingPurchases profiles:', profilesResult.error.message);
  if (plansResult.error) console.error('getPendingPurchases plans:', plansResult.error.message);
  if (categoriesResult.error) console.error('getPendingPurchases categories:', categoriesResult.error.message);
  const emailByUser = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.email]));
  const planById = new Map((plansResult.data ?? []).map((plan) => [plan.id, plan.name]));
  const categoryById = new Map((categoriesResult.data ?? []).map((category) => {
    const official = applyOfficialCategoryDisplay(category) as any;
    return [category.id, official.name];
  }));
  return purchases.map((purchase) => ({
    id: purchase.id,
    userId: purchase.user_id,
    userEmail: emailByUser.get(purchase.user_id) ?? null,
    planName: purchase.plan_id ? planById.get(purchase.plan_id) ?? null : null,
    categoryName: purchase.category_id ? categoryById.get(purchase.category_id) ?? null : null,
    planId: purchase.plan_id,
    categoryId: purchase.category_id,
    createdAt: purchase.created_at,
    notes: purchase.notes,
  }));
}

export async function searchAdminUserByEmail(email: string): Promise<AdminFoundUser> {
  const empty: AdminFoundUser = { id: '', email: null, fullName: null, phone: null, createdAt: '', activeAccesses: [] };
  if (!ready() || !supabase) return empty;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return empty;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,email,full_name,phone,created_at').ilike('email', normalizedEmail).maybeSingle();
  if (profileError || !profile) {
    if (profileError) console.error('searchAdminUserByEmail:', profileError.message);
    return empty;
  }
  const { data: accesses, error: accessError } = await supabase.from('user_category_access').select('category_id,status,created_at,updated_at').eq('user_id', profile.id).eq('status', 'active').order('created_at', { ascending: false });
  if (accessError) console.error('searchAdminUserByEmail access:', accessError.message);
  const categoryIds = [...new Set((accesses ?? []).map((access) => access.category_id))];
  const categoriesResult = categoryIds.length ? await supabase.from('categories').select('id,name,slug,icon,sort_order').in('id', categoryIds) : { data: [], error: null };
  if (categoriesResult.error) console.error('searchAdminUserByEmail categories:', categoriesResult.error.message);
  const categoryById = new Map((categoriesResult.data ?? []).map((category) => {
    const official = applyOfficialCategoryDisplay(category) as any;
    return [category.id, official.name];
  }));
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    createdAt: profile.created_at,
    activeAccesses: (accesses ?? []).map((access) => ({
      categoryId: access.category_id,
      categoryName: categoryById.get(access.category_id) ?? 'Carpeta sin nombre',
      status: access.status,
      createdAt: access.created_at,
      updatedAt: access.updated_at,
    })),
  };
}

export async function grantCategoryAccessesByEmail(params: { email: string; categoryIds: string[]; adminUserId: string; source?: 'manual' | 'pending_request'; pendingPurchaseId?: string; notes?: string }) {
  if (!ready() || !supabase) return { userId: '', email: null, categoryNames: [], message: activationWhatsAppMessage };
  const normalizedEmail = params.email.trim().toLowerCase();
  const categoryIds = [...new Set(params.categoryIds.filter(Boolean))];
  if (!normalizedEmail || !categoryIds.length) return { userId: '', email: null, categoryNames: [], message: activationWhatsAppMessage };

  const [{ data: profile, error: profileError }, { data: categories, error: categoryError }] = await Promise.all([
    supabase.from('profiles').select('id,email,full_name,phone,created_at').ilike('email', normalizedEmail).maybeSingle(),
    supabase.from('categories').select('id,name,slug,icon,sort_order').in('id', categoryIds),
  ]);
  if (profileError || categoryError || !profile) {
    if (profileError) console.error('grantCategoryAccessesByEmail profile:', profileError.message);
    if (categoryError) console.error('grantCategoryAccessesByEmail categories:', categoryError.message);
    return { userId: '', email: null, categoryNames: [], message: activationWhatsAppMessage };
  }
  const now = new Date().toISOString();
  const accessRows = categoryIds.map((categoryId) => ({ user_id: profile.id, category_id: categoryId, granted_by: params.adminUserId, status: 'active' as const, updated_at: now }));
  const { error: accessError } = await supabase.from('user_category_access').upsert(accessRows, { onConflict: 'user_id,category_id' });
  if (accessError) {
    console.error('grantCategoryAccessesByEmail access:', accessError.message);
    return { userId: profile.id, email: profile.email, categoryNames: [], message: activationWhatsAppMessage };
  }
  const purchaseRows = categoryIds.map((categoryId) => ({ user_id: profile.id, category_id: categoryId, status: 'active' as const, granted_by: params.adminUserId, granted_at: now, notes: params.notes ?? 'Acceso activado manualmente por email.' }));
  const { error: purchaseError } = await supabase.from('purchases').insert(purchaseRows);
  if (purchaseError) console.error('grantCategoryAccessesByEmail purchases:', purchaseError.message);
  const { error: auditError } = await supabase.from('audit_logs').insert({ actor_id: params.adminUserId, action: 'admin_granted_category_access', target_type: 'user_category_access', target_id: profile.id, metadata: { email: profile.email, category_ids: categoryIds, source: params.source ?? 'manual' } });
  if (auditError) console.error('grantCategoryAccessesByEmail audit:', auditError.message);
  return {
    userId: profile.id,
    email: profile.email,
    categoryNames: sortByOfficialOrder((categories ?? []).map((category) => applyOfficialCategoryDisplay(category) as any)).map((category) => category.name),
    message: activationWhatsAppMessage,
  };
}

export async function activateCategoryAccessByEmail(params: { email: string; categoryId: string; adminUserId: string; source?: 'manual' | 'pending_request'; pendingPurchaseId?: string; notes?: string }) {
  const result = await grantCategoryAccessesByEmail({ email: params.email, categoryIds: [params.categoryId], adminUserId: params.adminUserId, source: params.source, pendingPurchaseId: params.pendingPurchaseId, notes: params.notes });
  return { userId: result.userId, email: result.email, categoryName: result.categoryNames[0] ?? 'Carpeta activada', message: result.message };
}

export async function cancelPendingPurchase(params: { purchaseId: string; adminUserId: string }) {
  if (!ready() || !supabase) return false;
  const { error } = await supabase.from('purchases').update({ status: 'revoked', granted_by: params.adminUserId, granted_at: new Date().toISOString(), notes: 'Solicitud cancelada desde panel admin.', updated_at: new Date().toISOString() }).eq('id', params.purchaseId);
  if (error) {
    console.error('cancelPendingPurchase:', error.message);
    return false;
  }
  return true;
}
