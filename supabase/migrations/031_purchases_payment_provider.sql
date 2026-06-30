-- ============================================================================
-- 031 — Columnas de pasarela de pago en `purchases` (para Culqi).
--
-- ⚠️ NO APLICAR EN PRODUCCIÓN todavía. Aplícala cuando vayas a activar Culqi
-- (junto con desplegar la Edge Function y configurar las llaves). Es idempotente
-- y aditiva; no toca datos existentes ni el flujo manual de Yape.
--
-- Mantiene el modelo actual (status: pending/active/revoked/expired) y solo
-- agrega trazabilidad del cobro automático. `provider='manual'` = flujo Yape
-- de siempre; `provider='culqi'` = activado por la pasarela.
-- ============================================================================

begin;

alter table public.purchases
  add column if not exists provider           text not null default 'manual',
  add column if not exists provider_charge_id text,
  add column if not exists amount             numeric(10,2),
  add column if not exists currency           text not null default 'PEN',
  add column if not exists paid_at            timestamptz;

-- Idempotencia: un mismo cargo de Culqi nunca debe activar dos veces.
create unique index if not exists uq_purchases_provider_charge_id
  on public.purchases(provider_charge_id)
  where provider_charge_id is not null;

-- (opcional) validar el conjunto de proveedores conocidos
do $$
begin
  if not exists (select 1 from pg_constraint where conname='purchases_provider_chk' and conrelid='public.purchases'::regclass) then
    alter table public.purchases
      add constraint purchases_provider_chk check (provider in ('manual','culqi'));
  end if;
end $$;

commit;
