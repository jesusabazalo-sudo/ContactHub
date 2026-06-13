import { supabase } from '../lib/supabaseClient';
import { sanitizeText } from '../lib/sanitize';

export type AccessType = 'manual' | 'paid' | 'reward' | 'trial' | 'gift' | 'receipt';

export type GrantCategoryAccessParams = {
  targetUserId: string;
  targetUserEmail?: string | null;
  categoryIds: string[];
  grantedBy: string;
  accessType?: AccessType;
  note?: string | null;
  source?: string | null;
};

type RevokeCategoryAccessParams = {
  targetUserId: string;
  categoryId: string;
  revokedBy: string;
  note?: string | null;
};

export type AccessResult = {
  ok: boolean;
  targetUserId: string;
  targetUserEmail: string | null;
  categoryIds: string[];
  categoryNames: string[];
  grantedCount: number;
  verifiedAccesses: Array<{
    categoryId: string;
    status: string;
    accessType: string | null;
    grantedBy: string | null;
  }>;
  error?: string;
};

export type AccessDiagnostic = {
  id: string;
  userId: string;
  categoryId: string | null;
  categoryName: string;
  status: string;
  accessType: string | null;
  grantedBy: string | null;
};

type DbError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function client() {
  return supabase as unknown as { from: (table: string) => any } | null;
}

function looksLikeMissingAccessColumn(error: DbError | null | undefined) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ').toLowerCase();
  return ['access_type', 'source', 'note', 'category_slug', 'schema cache', 'column'].some((needle) => text.includes(needle));
}

function failure(targetUserId: string, categoryIds: string[], error: string): AccessResult {
  return { ok: false, targetUserId, targetUserEmail: null, categoryIds, categoryNames: [], grantedCount: 0, verifiedAccesses: [], error };
}

async function writeAccessRow(params: GrantCategoryAccessParams, categoryId: string, now: string) {
  const db = client();
  if (!db) return { ok: false, error: 'Supabase no está configurado.' };

  const note = sanitizeText(params.note ?? '', 700);
  const enhancedPayload = {
    user_id: params.targetUserId,
    category_id: categoryId,
    granted_by: params.grantedBy,
    status: 'active',
    access_type: params.accessType ?? 'manual',
    source: params.source ?? params.accessType ?? 'manual',
    note: note || null,
    updated_at: now,
  };
  const legacyPayload = {
    user_id: params.targetUserId,
    category_id: categoryId,
    granted_by: params.grantedBy,
    status: 'active',
    updated_at: now,
  };

  let updateResult = await db
    .from('user_category_access')
    .update(enhancedPayload)
    .eq('user_id', params.targetUserId)
    .eq('category_id', categoryId)
    .select('id');

  if (updateResult.error && looksLikeMissingAccessColumn(updateResult.error)) {
    updateResult = await db
      .from('user_category_access')
      .update(legacyPayload)
      .eq('user_id', params.targetUserId)
      .eq('category_id', categoryId)
      .select('id');
  }
  if (updateResult.error) return { ok: false, error: updateResult.error.message ?? 'No se pudo actualizar el acceso.' };
  if ((updateResult.data ?? []).length > 0) return { ok: true };

  let insertResult = await db.from('user_category_access').insert(enhancedPayload).select('id');
  if (insertResult.error && looksLikeMissingAccessColumn(insertResult.error)) {
    insertResult = await db.from('user_category_access').insert(legacyPayload).select('id');
  }
  if (insertResult.error) return { ok: false, error: insertResult.error.message ?? 'No se pudo crear el acceso.' };
  return { ok: true };
}

export async function grantCategoryAccess(params: GrantCategoryAccessParams): Promise<AccessResult> {
  const db = client();
  const categoryIds = [...new Set(params.categoryIds.filter(Boolean))];
  if (!db || !params.targetUserId || !params.grantedBy || !categoryIds.length) {
    return failure(params.targetUserId, categoryIds, 'Faltan datos para activar acceso.');
  }

  const [profileResult, categoriesResult] = await Promise.all([
    db.from('profiles').select('id,email').eq('id', params.targetUserId).maybeSingle(),
    db.from('categories').select('id,name,is_active').in('id', categoryIds),
  ]);

  if (profileResult.error || !profileResult.data) {
    return failure(params.targetUserId, categoryIds, profileResult.error?.message ?? 'El usuario destino no existe.');
  }
  if (
    params.targetUserEmail
    && profileResult.data.email?.trim().toLowerCase() !== params.targetUserEmail.trim().toLowerCase()
  ) {
    return failure(params.targetUserId, categoryIds, 'El correo no coincide con el ID del cliente seleccionado.');
  }
  if (categoriesResult.error) {
    return failure(params.targetUserId, categoryIds, categoriesResult.error.message ?? 'No se pudieron validar las carpetas.');
  }

  const validCategories = (categoriesResult.data ?? [])
    .filter((category: { is_active?: boolean | null }) => category.is_active !== false)
    .sort((a: { id: string }, b: { id: string }) => categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id));
  const validIds = new Set(validCategories.map((category: { id: string }) => category.id));
  const invalidIds = categoryIds.filter((categoryId) => !validIds.has(categoryId));
  if (invalidIds.length) {
    return failure(params.targetUserId, categoryIds, `Hay ${invalidIds.length} carpetas inválidas o inactivas.`);
  }

  if (import.meta.env.DEV) {
    console.debug('CONTACTHUB_GRANT_ACCESS', {
      targetUserId: params.targetUserId,
      targetUserEmail: profileResult.data.email,
      adminUserId: params.grantedBy,
      categoryIds,
    });
  }

  const now = new Date().toISOString();
  const results = await Promise.all(categoryIds.map((categoryId) => writeAccessRow(params, categoryId, now)));
  const failed = results.find((result) => !result.ok);
  if (failed) {
    console.error('grantCategoryAccess write:', failed.error);
    return failure(params.targetUserId, categoryIds, failed.error ?? 'No se pudo guardar el acceso.');
  }

  let verification = await db
    .from('user_category_access')
    .select('user_id,category_id,status,access_type,granted_by')
    .eq('user_id', params.targetUserId)
    .eq('status', 'active')
    .in('category_id', categoryIds);

  if (verification.error && looksLikeMissingAccessColumn(verification.error)) {
    verification = await db
      .from('user_category_access')
      .select('user_id,category_id,status,granted_by')
      .eq('user_id', params.targetUserId)
      .eq('status', 'active')
      .in('category_id', categoryIds);
  }
  if (verification.error) {
    return failure(params.targetUserId, categoryIds, verification.error.message ?? 'No se pudo verificar el acceso.');
  }

  const verifiedRows = (verification.data ?? []) as Array<{
    user_id: string;
    category_id: string;
    status: string;
    access_type?: string | null;
    granted_by?: string | null;
  }>;
  const verifiedIds = new Set(verifiedRows.map((access) => access.category_id));
  if (categoryIds.some((categoryId) => !verifiedIds.has(categoryId))) {
    console.error('grantCategoryAccess verification mismatch:', {
      targetUserId: params.targetUserId,
      requestedCategoryIds: categoryIds,
      verifiedRows,
    });
    return failure(params.targetUserId, categoryIds, 'No se pudo confirmar el acceso del cliente.');
  }

  return {
    ok: true,
    targetUserId: params.targetUserId,
    targetUserEmail: profileResult.data.email ?? null,
    categoryIds,
    categoryNames: validCategories.map((category: { name: string }) => category.name),
    grantedCount: categoryIds.length,
    verifiedAccesses: verifiedRows.map((access) => ({
      categoryId: access.category_id,
      status: access.status,
      accessType: access.access_type ?? null,
      grantedBy: access.granted_by ?? null,
    })),
  };
}

export async function getUserAccessDiagnostics(targetUserId: string): Promise<AccessDiagnostic[]> {
  const db = client();
  if (!db || !targetUserId) return [];

  let accessResult = await db
    .from('user_category_access')
    .select('id,user_id,category_id,status,access_type,granted_by')
    .eq('user_id', targetUserId)
    .eq('status', 'active');

  if (accessResult.error && looksLikeMissingAccessColumn(accessResult.error)) {
    accessResult = await db
      .from('user_category_access')
      .select('id,user_id,category_id,status,granted_by')
      .eq('user_id', targetUserId)
      .eq('status', 'active');
  }
  if (accessResult.error) throw new Error(accessResult.error.message ?? 'No se pudieron verificar los accesos reales.');

  const rows = (accessResult.data ?? []) as Array<{
    id: string;
    user_id: string;
    category_id: string | null;
    status: string;
    access_type?: string | null;
    granted_by?: string | null;
  }>;
  const categoryIds = [...new Set(rows.map((row) => row.category_id).filter((id): id is string => Boolean(id)))];
  const categoryResult = categoryIds.length
    ? await db.from('categories').select('id,name').in('id', categoryIds)
    : { data: [], error: null };
  if (categoryResult.error) throw new Error(categoryResult.error.message ?? 'No se pudieron resolver las carpetas activas.');
  const categoryById = new Map<string, string>(
    (categoryResult.data ?? []).map((category: { id: string; name: string }) => [category.id, category.name]),
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_id ? categoryById.get(row.category_id) ?? 'Carpeta no vinculada' : 'Carpeta no vinculada',
    status: row.status,
    accessType: row.access_type ?? null,
    grantedBy: row.granted_by ?? null,
  }));
}

export async function revokeCategoryAccess(params: RevokeCategoryAccessParams) {
  const db = client();
  if (!db || !params.targetUserId || !params.categoryId || !params.revokedBy) {
    return { ok: false, error: 'Faltan datos para revocar acceso.' };
  }

  const now = new Date().toISOString();
  const enhanced = await db
    .from('user_category_access')
    .update({
      status: 'revoked',
      granted_by: params.revokedBy,
      source: 'revoked',
      note: sanitizeText(params.note ?? 'Acceso revocado desde admin.', 700),
      updated_at: now,
    })
    .eq('user_id', params.targetUserId)
    .eq('category_id', params.categoryId)
    .select('id');

  if (!enhanced.error) {
    return (enhanced.data ?? []).length > 0
      ? { ok: true }
      : { ok: false, error: 'No se encontró el acceso activo para revocar.' };
  }

  if (!looksLikeMissingAccessColumn(enhanced.error)) {
    console.error('revokeCategoryAccess:', enhanced.error.message);
    return { ok: false, error: enhanced.error.message };
  }

  const legacy = await db
    .from('user_category_access')
    .update({ status: 'revoked', granted_by: params.revokedBy, updated_at: now })
    .eq('user_id', params.targetUserId)
    .eq('category_id', params.categoryId)
    .select('id');

  if (legacy.error) {
    console.error('revokeCategoryAccess legacy:', legacy.error.message);
    return { ok: false, error: legacy.error.message };
  }

  return (legacy.data ?? []).length > 0
    ? { ok: true }
    : { ok: false, error: 'No se encontró el acceso activo para revocar.' };
}

export async function reassignUnlinkedAccess(params: {
  accessId: string;
  targetUserId: string;
  categoryId: string;
  grantedBy: string;
}) {
  const db = client();
  if (!db || !params.accessId || !params.targetUserId || !params.categoryId || !params.grantedBy) {
    return { ok: false, error: 'Faltan datos para reasignar el acceso.' };
  }

  const category = await db.from('categories').select('id').eq('id', params.categoryId).eq('is_active', true).maybeSingle();
  if (category.error || !category.data) return { ok: false, error: category.error?.message ?? 'La carpeta destino no existe.' };

  const now = new Date().toISOString();
  const enhanced = await db
    .from('user_category_access')
    .update({
      category_id: params.categoryId,
      status: 'active',
      granted_by: params.grantedBy,
      access_type: 'manual',
      source: 'legacy_reassignment',
      note: 'Acceso antiguo reasignado desde Admin Accesos.',
      updated_at: now,
    })
    .eq('id', params.accessId)
    .eq('user_id', params.targetUserId)
    .select('id');

  if (!enhanced.error) {
    return (enhanced.data ?? []).length === 1
      ? { ok: true }
      : { ok: false, error: 'No se encontró el acceso antiguo para reasignar.' };
  }

  if (!looksLikeMissingAccessColumn(enhanced.error)) return { ok: false, error: enhanced.error.message };

  const legacy = await db
    .from('user_category_access')
    .update({ category_id: params.categoryId, status: 'active', granted_by: params.grantedBy, updated_at: now })
    .eq('id', params.accessId)
    .eq('user_id', params.targetUserId)
    .select('id');

  if (legacy.error) return { ok: false, error: legacy.error.message };
  return (legacy.data ?? []).length === 1
    ? { ok: true }
    : { ok: false, error: 'No se encontró el acceso antiguo para reasignar.' };
}

export async function revokeUnlinkedAccess(params: {
  accessId: string;
  targetUserId: string;
  revokedBy: string;
}) {
  const db = client();
  if (!db || !params.accessId || !params.targetUserId || !params.revokedBy) {
    return { ok: false, error: 'Faltan datos para retirar el acceso antiguo.' };
  }

  const result = await db
    .from('user_category_access')
    .update({ status: 'revoked', granted_by: params.revokedBy, updated_at: new Date().toISOString() })
    .eq('id', params.accessId)
    .eq('user_id', params.targetUserId)
    .select('id');

  if (result.error) return { ok: false, error: result.error.message };
  return (result.data ?? []).length === 1
    ? { ok: true }
    : { ok: false, error: 'No se encontró el acceso antiguo.' };
}
