-- ============================================================================
-- 036 — Índices de performance (Fase 4, sección B1).
--
-- Verificado contra pg_indexes del proyecto en vivo antes de escribir esto:
-- ya existían idx_contacts_status_risk, idx_purchases_user_status,
-- idx_user_category_access_user_status, idx_reclamaciones_estado — no se
-- duplican. El resto son índices de foreign key faltantes detectados por
-- el advisor de performance de Supabase (unindexed_foreign_keys) más el
-- índice de búsqueda por nombre (trigram) para el admin.
--
-- idx_contact_views_user_created se omite aquí: la tabla contact_views
-- (migración 034) todavía no está aplicada en producción. Cuando se aplique,
-- crear ese índice en una migración aparte.
-- ============================================================================

begin;

-- Búsqueda de contactos por categoría+estado (patrón más frecuente del catálogo)
create index if not exists idx_contacts_category_status
  on public.contacts(category_id, status);

-- Búsqueda de contactos por nombre (admin, 2700+ filas)
create extension if not exists pg_trgm;
create index if not exists idx_contacts_name_trgm
  on public.contacts using gin (name gin_trgm_ops);

-- Comprobantes de pago ordenados por estado y fecha (admin)
create index if not exists idx_payment_receipts_status_date
  on public.payment_receipts(status, created_at desc);

-- Foreign keys sin índice de cobertura (advisor: unindexed_foreign_keys)
create index if not exists idx_audit_logs_actor_id
  on public.audit_logs(actor_id);

create index if not exists idx_contacts_subcategory_id
  on public.contacts(subcategory_id);

create index if not exists idx_customer_feedback_user_id
  on public.customer_feedback(user_id);

create index if not exists idx_customer_notes_user_id
  on public.customer_notes(user_id);

create index if not exists idx_customer_rewards_user_id
  on public.customer_rewards(user_id);

create index if not exists idx_payment_receipts_reviewed_by
  on public.payment_receipts(reviewed_by);

create index if not exists idx_payment_receipts_user_id
  on public.payment_receipts(user_id);

create index if not exists idx_public_reviews_user_id
  on public.public_reviews(user_id);

create index if not exists idx_purchases_category_id
  on public.purchases(category_id);

create index if not exists idx_purchases_granted_by
  on public.purchases(granted_by);

create index if not exists idx_purchases_plan_id
  on public.purchases(plan_id);

create index if not exists idx_reclamaciones_user_id
  on public.reclamaciones(user_id);

create index if not exists idx_reward_requests_review_id
  on public.reward_requests(review_id);

create index if not exists idx_reward_requests_user_id
  on public.reward_requests(user_id);

create index if not exists idx_user_category_access_category_id
  on public.user_category_access(category_id);

create index if not exists idx_user_category_access_granted_by
  on public.user_category_access(granted_by);

commit;
