# Changelog

Historial de las 4 fases de rediseño y endurecimiento de ContactHub.

## Fase 1 — Sistema de diseño, tema oscuro/claro y confianza

- Sistema de tokens de color semánticos (claro/oscuro) en `src/styles/index.css`, sin colores hardcodeados.
- `ThemeProvider` + toggle de tema persistente.
- Rediseño completo del embudo público: Home, Catálogo, Categoría, Precios, Auth, `ContactCard`.
- Rediseño del panel admin y componentes compartidos.
- Trust system: `TrustBar`, `SocialProof`, `PricingFAQ`, `TrustBadges`, `PricingSteps`, aviso de privacidad en el chat.
- Fixes de fondo: `.maybeSingle()` en `checkUserTotalAccess`, N+1 en catálogo, teléfono directo en `getTrialContacts`, consulta a tabla inexistente `reward_requests`.
- Consolidación de árboles de migraciones SQL duplicados.

## Fase 2 — Microinteracciones, catálogo premium y buscador inteligente

- `useRipple`, animaciones de copiar/WhatsApp/desbloqueo, skeletons (`SkeletonCard`, `PageSkeleton` embrionario).
- Rediseño de `CategoryCard` (badges de estado, barra de completitud, preview de contactos enmascarados).
- Toggle grid/lista en el catálogo, persistido en `localStorage`.
- Historial de búsquedas recientes en `GlobalSearch`.
- Sistema de toasts propio (`src/lib/toast.ts`) con icono, barra de progreso y cierre manual.
- Integración de Stripe Checkout (Edge Functions `stripe-checkout` / `stripe-webhook`), sin reemplazar el flujo manual Yape/Plin.

## Fase 3 — Dashboard del cliente, rendimiento y responsive

- Dashboard de cliente rediseñado como aplicación: sidebar fijo en desktop, bottom tabs en móvil, 4 secciones (Mis carpetas, Recientes, Estadísticas, Configuración).
- `src/lib/queryCache.ts` (cache en memoria con TTL) aplicado a categorías del catálogo, folders del Hero y datos de `MyContactsPage`.
- Lazy loading de todas las páginas excepto Home vía `React.lazy` + `Suspense` — bundle inicial reducido ~52% en esa fase.
- `React.memo` en `CategoryCard` y `ContactCard`; `useCallback`/`useMemo` en filtros y callbacks de listas.
- `useVirtualList` (hook de virtualización simple, listo para usar en listas largas).
- Prefetch de rutas en el navbar al hacer hover (Catálogo, Precios).
- Responsive: tipografía fluida con `clamp()`, grid del catálogo escalonado hasta 5 columnas en ultrawide, tap targets de 44px en móvil.
- `SplashScreen` (máx. 300ms), `ErrorBoundary` mejorado, página 404 dedicada, `ScrollToTop` en cada cambio de ruta.
- Migración `034_contact_views.sql` preparada (tracking de copy/WhatsApp) — se aplicó en Fase 4.

## Fase 4 — Admin, Supabase y limpieza final

**Supabase (auditado y corregido en vivo contra el proyecto de producción):**
- Migración `035_rls_performance_optimization.sql`: 41 políticas RLS reescritas para evitar reevaluar `auth.uid()` por fila (`auth_rls_initplan`), sin cambiar su lógica de acceso.
- Migración `036_performance_indexes.sql`: índice compuesto `contacts(category_id, status)`, índice trigram para búsqueda de nombre en el admin, `idx_payment_receipts_status_date` y 14 índices de foreign key que el advisor de Supabase marcaba como faltantes.
- Migración `037_revoke_anon_is_admin_execute.sql`: revocado `EXECUTE` de `is_admin()` al rol `anon` (antes heredado vía `PUBLIC`); `authenticated` sigue funcionando sin cambios.
- Auditoría de consistencia de datos (contactos sin descripción, sin categoría, accesos huérfanos, categorías activas sin contactos): **0 inconsistencias encontradas**, no hizo falta migración de limpieza.
- `contact_views` (tabla de Fase 3) revisada: se mantiene sin aplicar hasta que se decida activar el tracking de actividad.

**Admin:**
- `AdminContactsPage`: filtros de calidad/tag ahora resetean la página a 0 al cambiar (bug real: solo categoría/estado lo hacían); acciones por fila (aprobar/archivar/eliminar) con loading independiente por fila en vez de bloquear toda la tabla; indicador de selección en formato "X de Y seleccionados".
- `AdminUsersPage`: confirmación con nombre de carpetas y usuario antes de regalar acceso.
- `AdminPaymentReceiptsPage`: actualización optimista tras aprobar/rechazar (ya no recarga los 250 comprobantes ni re-firma sus URLs); confirmación antes de activar acceso por comprobante.
- `AdminSoportePage`: scroll automático al mensaje más reciente al abrir o recibir una conversación.
- `AdminCategoriasPage`: confirmación con conteo real de contactos activos al desactivar una carpeta con más de 50; vista previa en vivo del nombre/ícono/descripción en el modal de edición.
- `AdminRecompensasPage`: filtros pendientes/aprobadas/rechazadas/todas para misiones; confirmación con el nombre del usuario antes de aprobar o rechazar.
- Eliminado `AdminRewardsPage.tsx`: componente duplicado y muerto, no enrutado en ningún lugar de `App.tsx`.

**Código:**
- `console.log`: 0 en todo `src/` (ya estaba así desde fases previas, confirmado por grep).
- `console.error` sin gating de `DEV`: revisado; se decidió no envolver los ~150 casos existentes porque siguen un patrón ya establecido en el proyecto (diagnóstico de errores reales, sin datos sensibles) y reescribirlos todos excedía el alcance razonable de esta fase — documentado como pendiente.
- `any`: reducidos los casos evidentes (tipo de payload realtime en `AdminUsersPage`); el resto (~24) son *type assertions* en la capa de servicios admin para el query-builder dinámico de Supabase, un patrón ya consistente en el proyecto — no se tocaron para evitar reescribir la capa de datos sin poder probarla contra el schema real.
- `.env.example` actualizado con `VITE_SITE_URL` (faltaba); `.gitignore` verificado correcto.
- Rate limiting client-side (`src/lib/rateLimit.ts`) migrado de memoria a `localStorage` (sobrevive a un refresh) y aplicado también al chat de soporte, además del login ya existente.

**Build:**
- `vite.config.ts`: `manualChunks` para separar `react`, `@supabase/supabase-js` y `lucide-react` en chunks propios — bundle principal de 616KB → 221KB, sin warnings de chunk grande.
