-- Rollback del sistema de tokens (038_token_system.sql). Feature prematura,
-- removida del producto. Renombrado a 039 porque 037 ya existe en el árbol
-- de migraciones (revoke_anon_is_admin_execute.sql).
begin;

drop table if exists public.contact_token_unlocks;
drop table if exists public.token_transactions;
drop table if exists public.user_tokens;

drop function if exists public.spend_token_to_unlock(uuid);
drop function if exists public.award_mission_tokens(uuid, integer, text, text);

drop trigger if exists on_user_created_give_tokens on auth.users;
drop function if exists public.give_initial_tokens();

commit;
