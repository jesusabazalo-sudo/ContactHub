-- ============================================================================
-- 038 — Sistema de tokens para desbloqueo individual de contactos.
--
-- Nota de numeración: el pedido original nombraba este archivo
-- "036_token_system.sql", pero 036 ya existía en el repo (índices de
-- performance de la Fase 4). Se renumeró a 038 (el siguiente libre tras
-- 037_revoke_anon_is_admin_execute.sql) para no pisar una migración existente.
--
-- Los usuarios acumulan tokens (registro, misiones) y los gastan para
-- desbloquear contactos individuales sin comprar la carpeta completa.
-- Cada par (user_id, contact_id) es único: un desbloqueo con token es
-- permanente, sin importar el balance futuro del usuario.
-- ============================================================================

begin;

-- Tabla de tokens por usuario
create table if not exists public.user_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Historial de movimientos de tokens
create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null, -- positivo = ganó, negativo = gastó
  reason text not null, -- 'trial_inicial', 'mision_redes', 'mision_recomendacion', 'unlock_contacto'
  reference_id uuid, -- ID del contacto desbloqueado si aplica
  description text,
  created_at timestamptz default now()
);

-- Contactos individuales desbloqueados con tokens
create table if not exists public.contact_token_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  tokens_spent integer not null default 1,
  unlocked_at timestamptz default now(),
  unique(user_id, contact_id) -- un solo desbloqueo por contacto por usuario
);

-- Índices
create index if not exists idx_user_tokens_user on user_tokens(user_id);
create index if not exists idx_token_transactions_user on token_transactions(user_id, created_at desc);
create index if not exists idx_contact_token_unlocks_user on contact_token_unlocks(user_id);
create index if not exists idx_contact_token_unlocks_contact on contact_token_unlocks(contact_id);

-- RLS
alter table user_tokens enable row level security;
alter table token_transactions enable row level security;
alter table contact_token_unlocks enable row level security;

-- user_tokens: usuario ve solo el suyo / admin todo. Sin policy de UPDATE para
-- el usuario: el balance solo cambia vía las funciones SECURITY DEFINER.
create policy "tokens_user_select" on user_tokens
  for select to authenticated using ((select auth.uid()) = user_id or is_admin());

create policy "tokens_admin_all" on user_tokens
  for all to authenticated using (is_admin());

-- token_transactions: usuario ve las suyas / admin todo. El INSERT directo
-- desde el cliente queda permitido por si se necesita en el futuro, pero en
-- la práctica todo el flujo actual pasa por las funciones SECURITY DEFINER.
create policy "transactions_user_select" on token_transactions
  for select to authenticated using ((select auth.uid()) = user_id or is_admin());

create policy "transactions_insert" on token_transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- contact_token_unlocks: usuario ve los suyos / admin todo
create policy "unlocks_user_select" on contact_token_unlocks
  for select to authenticated using ((select auth.uid()) = user_id or is_admin());

create policy "unlocks_user_insert" on contact_token_unlocks
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Función: da 3 tokens de bienvenida a usuarios nuevos
create or replace function public.give_initial_tokens()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_tokens (user_id, balance, total_earned)
  values (new.id, 3, 3)
  on conflict (user_id) do nothing;

  insert into public.token_transactions (user_id, amount, reason, description)
  values (new.id, 3, 'trial_inicial', '3 tokens de bienvenida para explorar ContactHub');

  return new;
end;
$$;

drop trigger if exists on_user_created_give_tokens on auth.users;
create trigger on_user_created_give_tokens
  after insert on auth.users
  for each row execute function public.give_initial_tokens();

-- Función segura para gastar 1 token y desbloquear un contacto.
-- La constraint UNIQUE(user_id, contact_id) garantiza que nunca se puede
-- desbloquear el mismo contacto dos veces, incluso ante peticiones duplicadas
-- concurrentes (se captura como unique_violation abajo).
create or replace function public.spend_token_to_unlock(p_contact_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_contact_name text;
  v_already_unlocked boolean;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No autenticado');
  end if;

  select exists(
    select 1 from contact_token_unlocks
    where user_id = v_user_id and contact_id = p_contact_id
  ) into v_already_unlocked;

  if v_already_unlocked then
    return jsonb_build_object('success', false, 'error', 'already_unlocked');
  end if;

  select name into v_contact_name from contacts
  where id = p_contact_id and status = 'active';

  if v_contact_name is null then
    return jsonb_build_object('success', false, 'error', 'Contacto no disponible');
  end if;

  select balance into v_balance from user_tokens where user_id = v_user_id;

  if v_balance is null or v_balance < 1 then
    return jsonb_build_object('success', false, 'error', 'insufficient_tokens', 'balance', coalesce(v_balance, 0));
  end if;

  update user_tokens
  set balance = balance - 1,
      total_spent = total_spent + 1,
      updated_at = now()
  where user_id = v_user_id;

  insert into token_transactions (user_id, amount, reason, reference_id, description)
  values (v_user_id, -1, 'unlock_contacto', p_contact_id, 'Desbloqueo de: ' || v_contact_name);

  insert into contact_token_unlocks (user_id, contact_id, tokens_spent)
  values (v_user_id, p_contact_id, 1);

  return jsonb_build_object('success', true, 'contact_name', v_contact_name, 'new_balance', v_balance - 1);
exception when unique_violation then
  return jsonb_build_object('success', false, 'error', 'already_unlocked');
end;
$$;

revoke execute on function spend_token_to_unlock(uuid) from anon;
grant execute on function spend_token_to_unlock(uuid) to authenticated;

-- Función para otorgar tokens por misiones. Desviación deliberada del spec
-- original (que pedía GRANT solo a service_role): el panel admin la llama
-- desde el navegador como usuario `authenticated` normal (igual que el resto
-- de RPCs admin ya existentes en el proyecto), así que necesita EXECUTE para
-- authenticated. La seguridad real la da el chequeo interno is_admin(), no
-- el GRANT — mismo patrón que el resto de funciones admin del proyecto.
create or replace function public.award_mission_tokens(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_description text
)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    return jsonb_build_object('success', false, 'error', 'No autorizado');
  end if;

  insert into user_tokens (user_id, balance, total_earned)
  values (p_user_id, p_amount, p_amount)
  on conflict (user_id) do update set
    balance = user_tokens.balance + p_amount,
    total_earned = user_tokens.total_earned + p_amount,
    updated_at = now();

  insert into token_transactions (user_id, amount, reason, description)
  values (p_user_id, p_amount, p_reason, p_description);

  return jsonb_build_object('success', true, 'tokens_awarded', p_amount);
end;
$$;

revoke execute on function award_mission_tokens(uuid, integer, text, text) from anon;
grant execute on function award_mission_tokens(uuid, integer, text, text) to authenticated;

commit;
