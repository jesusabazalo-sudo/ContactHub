-- ============================================================================
-- 035 — Optimización de rendimiento en políticas RLS (auth_rls_initplan).
--
-- El linter de Supabase detectó 41 políticas que llaman a auth.uid() (o a
-- funciones que lo envuelven, como is_admin(auth.uid())) directamente en su
-- expresión USING/WITH CHECK. Postgres re-evalúa esa llamada por cada fila
-- de la tabla en vez de una sola vez por consulta. Envolviendo la llamada en
-- (select auth.uid()) el planner la trata como InitPlan (se evalúa una vez y
-- se reutiliza), sin cambiar el comportamiento de la política.
--
-- Esta migración solo reescribe DROP POLICY + CREATE POLICY con la misma
-- condición, cambiando auth.uid() -> (select auth.uid()). No cambia a quién
-- se le permite qué. Verificado contra pg_policies del proyecto en vivo
-- (zecysscsehgejdklvcva) antes de escribir esta migración.
--
-- Ya aplicada directamente en el proyecto vía Supabase MCP (auditoría en
-- vivo, Fase 4). Este archivo documenta el cambio para mantener el repo en
-- sincronía con el estado real de la base de datos.
-- ============================================================================

begin;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or is_admin((select auth.uid())))
  with check (id = (select auth.uid()) or is_admin((select auth.uid())));

-- user_roles ------------------------------------------------------------------
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert" on public.user_roles
  for insert to authenticated
  with check (is_admin((select auth.uid())));

drop policy if exists "user_roles_admin_update" on public.user_roles;
create policy "user_roles_admin_update" on public.user_roles
  for update to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete" on public.user_roles
  for delete to authenticated
  using (is_admin((select auth.uid())));

-- categories ------------------------------------------------------------------
drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage" on public.categories
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- subcategories ------------------------------------------------------------------
drop policy if exists "subcategories_admin_manage" on public.subcategories;
create policy "subcategories_admin_manage" on public.subcategories
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- contacts ------------------------------------------------------------------
drop policy if exists "contacts_authenticated_unlocked_select" on public.contacts;
create policy "contacts_authenticated_unlocked_select" on public.contacts
  for select to authenticated
  using (
    status = 'active'
    and risk_level = 'safe'
    and has_category_access((select auth.uid()), category_id)
  );

drop policy if exists "contacts_admin_manage" on public.contacts;
create policy "contacts_admin_manage" on public.contacts
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- plans ------------------------------------------------------------------
drop policy if exists "plans_admin_manage" on public.plans;
create policy "plans_admin_manage" on public.plans
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- purchases ------------------------------------------------------------------
drop policy if exists "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_admin" on public.purchases
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "purchases_user_create_pending_own" on public.purchases;
create policy "purchases_user_create_pending_own" on public.purchases
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and granted_by is null
    and granted_at is null
  );

drop policy if exists "purchases_admin_manage" on public.purchases;
create policy "purchases_admin_manage" on public.purchases
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- user_category_access --------------------------------------------------------
drop policy if exists "user_category_access_select_own_or_admin" on public.user_category_access;
create policy "user_category_access_select_own_or_admin" on public.user_category_access
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "user_category_access_admin_manage" on public.user_category_access;
create policy "user_category_access_admin_manage" on public.user_category_access
  for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- trial_claims ------------------------------------------------------------------
drop policy if exists "trial_claims_select_own_or_admin" on public.trial_claims;
create policy "trial_claims_select_own_or_admin" on public.trial_claims
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "trial_claims_insert_own" on public.trial_claims;
create policy "trial_claims_insert_own" on public.trial_claims
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- audit_logs ------------------------------------------------------------------
drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select" on public.audit_logs
  for select to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "audit_logs_admin_insert" on public.audit_logs;
create policy "audit_logs_admin_insert" on public.audit_logs
  for insert to authenticated
  with check (is_admin((select auth.uid())));

-- chat_messages ------------------------------------------------------------------
drop policy if exists "chat_messages_insert_public" on public.chat_messages;
create policy "chat_messages_insert_public" on public.chat_messages
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "chat_messages_select_own_or_admin" on public.chat_messages;
create policy "chat_messages_select_own_or_admin" on public.chat_messages
  for select to authenticated
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "chat_admin_all" on public.chat_messages;
create policy "chat_admin_all" on public.chat_messages
  for all to public
  using (is_admin((select auth.uid())));

-- customer_status ------------------------------------------------------------------
drop policy if exists "cs_admin" on public.customer_status;
create policy "cs_admin" on public.customer_status
  for all to public
  using (is_admin((select auth.uid())));

drop policy if exists "cs_own_select" on public.customer_status;
create policy "cs_own_select" on public.customer_status
  for select to public
  using ((select auth.uid()) = user_id);

-- customer_rewards ------------------------------------------------------------------
drop policy if exists "cr_admin" on public.customer_rewards;
create policy "cr_admin" on public.customer_rewards
  for all to public
  using (is_admin((select auth.uid())));

drop policy if exists "cr_own_select" on public.customer_rewards;
create policy "cr_own_select" on public.customer_rewards
  for select to public
  using ((select auth.uid()) = user_id);

-- customer_notes ------------------------------------------------------------------
drop policy if exists "cn_admin" on public.customer_notes;
create policy "cn_admin" on public.customer_notes
  for all to public
  using (is_admin((select auth.uid())));

-- customer_feedback ------------------------------------------------------------------
drop policy if exists "cf_admin" on public.customer_feedback;
create policy "cf_admin" on public.customer_feedback
  for all to public
  using (is_admin((select auth.uid())));

-- public_reviews ------------------------------------------------------------------
drop policy if exists "public_reviews_read_approved" on public.public_reviews;
create policy "public_reviews_read_approved" on public.public_reviews
  for select to public
  using (
    status = 'approved'
    or is_admin((select auth.uid()))
    or user_id = (select auth.uid())
  );

drop policy if exists "public_reviews_insert_authenticated" on public.public_reviews;
create policy "public_reviews_insert_authenticated" on public.public_reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "public_reviews_admin_update" on public.public_reviews;
create policy "public_reviews_admin_update" on public.public_reviews
  for update to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- reward_requests ------------------------------------------------------------------
drop policy if exists "reward_requests_owner_read" on public.reward_requests;
create policy "reward_requests_owner_read" on public.reward_requests
  for select to public
  using (user_id = (select auth.uid()) or is_admin((select auth.uid())));

drop policy if exists "reward_requests_admin_update" on public.reward_requests;
create policy "reward_requests_admin_update" on public.reward_requests
  for update to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

drop policy if exists "reward_requests_admin_delete" on public.reward_requests;
create policy "reward_requests_admin_delete" on public.reward_requests
  for delete to public
  using (is_admin((select auth.uid())));

drop policy if exists "reward_requests_owner_insert" on public.reward_requests;
create policy "reward_requests_owner_insert" on public.reward_requests
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and coalesce(array_length(bonus_contact_ids, 1), 0) = 0
  );

-- reclamaciones ------------------------------------------------------------------
drop policy if exists "reclamaciones_admin_select" on public.reclamaciones;
create policy "reclamaciones_admin_select" on public.reclamaciones
  for select to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "reclamaciones_admin_update" on public.reclamaciones;
create policy "reclamaciones_admin_update" on public.reclamaciones
  for update to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

-- payment_receipts ------------------------------------------------------------------
drop policy if exists "pr_user_select" on public.payment_receipts;
create policy "pr_user_select" on public.payment_receipts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "pr_user_insert" on public.payment_receipts;
create policy "pr_user_insert" on public.payment_receipts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

commit;
