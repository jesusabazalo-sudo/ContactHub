-- ============================================================================
-- 027 — Columnas de orden en `categories` (arregla el error 400 del catálogo).
--
-- La app consulta y ordena por categories.sort_order / display_order, que no
-- existían en la base (las añadían 003/008, no aplicadas). Sin ellas, consultas
-- como las del modal "Probar 3 contactos gratis" devolvían 400 (Bad Request) y
-- dejaban la pantalla con un overlay oscuro sin contenido.
--
-- Se añaden como NULLABLE: el orden visible lo deriva el código desde
-- officialCategories (sortByOfficialOrder), así que basta con que las columnas
-- existan para que las consultas dejen de fallar. Idempotente.
-- ============================================================================

begin;

alter table public.categories
  add column if not exists sort_order    integer,
  add column if not exists display_order integer;

create index if not exists idx_categories_sort_order on public.categories(sort_order);

commit;
