-- ============================================================================
-- 029 — FIX DE SEGURIDAD P0: fuga de teléfonos en `contacts`.
--
-- Problema: la política `contacts_public_safe_preview_select` daba a CUALQUIER
-- usuario autenticado acceso de fila a toda la tabla `contacts`. Como el rol
-- `authenticated` tiene SELECT sobre la columna `phone`, cualquier cuenta GRATIS
-- podía hacer GET /rest/v1/contacts?select=phone y descargar todos los números
-- reales, saltándose el pago. (Verificado: un usuario gratis leía 1112/1112.)
--
-- Fix: se elimina esa política. El preview enmascarado se servía con la vista
-- `contact_public_preview`, que era security_invoker (dependía de esa política);
-- se pasa a definer para que siga mostrando SOLO columnas enmascaradas a todos
-- sin exponer la tabla base.
--
-- Quedan intactos: acceso pagado (política has_category_access + vista
-- contact_unlocked_secure) y admin (política is_admin). Verificado tras aplicar:
--   - usuario gratis: 0 teléfonos legibles, 1112 previews enmascarados.
--   - usuario pagado: ve los teléfonos reales de su carpeta.
-- ============================================================================

drop policy if exists "contacts_public_safe_preview_select" on public.contacts;

alter view public.contact_public_preview set (security_invoker = false);
