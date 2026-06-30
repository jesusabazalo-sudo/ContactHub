-- ============================================================================
-- 030 — FIX DE SEGURIDAD P0: auto-otorgamiento de acceso (bypass del pago).
--
-- La auditoría RLS encontró DOS vectores más (además de la fuga de contacts):
--
-- 1) reward_requests: la política de INSERT solo exigía user_id = auth.uid().
--    Un usuario podía auto-insertar status='approved' con bonus_contact_ids=[...]
--    y la vista contact_trial_secure le revelaba esos teléfonos gratis.
--    Fix: el usuario solo crea solicitudes PENDIENTES y sin bonus; aprobar y
--    asignar contactos bonus queda solo para admin (reward_requests_admin_update).
--
-- 2) trial_claims: el límite de 3 contactos era solo del lado cliente. Por API
--    directa se podía insertar un claim con N contactos y desbloquearlos todos.
--    Fix: CHECK en la BD (<= 3), que aplica a cualquier escritura.
--
-- Verificado tras aplicar (simulando un usuario gratis con su JWT):
--   - INSERT approved en reward_requests -> ERROR 42501 (RLS).
--   - INSERT de 10 contactos en trial_claims -> ERROR 23514 (check).
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trial_claims_max3_chk' and conrelid = 'public.trial_claims'::regclass
  ) then
    alter table public.trial_claims
      add constraint trial_claims_max3_chk check (coalesce(array_length(contact_ids, 1), 0) <= 3);
  end if;
end $$;

drop policy if exists "reward_requests_owner_insert" on public.reward_requests;
create policy "reward_requests_owner_insert"
on public.reward_requests for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and coalesce(array_length(bonus_contact_ids, 1), 0) = 0
);
