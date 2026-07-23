-- ============================================================================
-- 037 — Revoca EXECUTE de is_admin() al rol anon (hardening, sección B3/B4).
--
-- Verificado en vivo: `has_function_privilege('anon', 'public.is_admin()',
-- 'EXECUTE')` devolvía true (debería ser false, como pide el spec de Fase 4).
-- No es una vulnerabilidad explotable en sí (is_admin() con auth.uid() nulo
-- ya devuelve false para anon), pero es una buena práctica de defensa en
-- profundidad: nadie sin sesión necesita poder llamar a esta función.
--
-- has_category_access() NO se toca: el catálogo público (preview gratis)
-- depende de que anon pueda ejecutarla.
-- ============================================================================

begin;

-- El grant original era a PUBLIC (todo rol, incluido anon), no solo a anon
-- explícitamente: revocar solo "from anon" no bastaba (confirmado en vivo).
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin(uuid) from public;

-- authenticated sigue pudiendo llamarla (AuthProvider.tsx la usa vía RPC
-- para resolver el rol admin del usuario logueado).
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

commit;
