# ContactHub - Reporte de estabilizacion

Fecha: 2026-06-17

## Diagnostico ejecutado

- Se ejecuto `npm.cmd run build` como diagnostico inicial: compilo sin errores.
- Se buscaron patrones de riesgo en `src`: `window.location.reload`, `window.location.href`, `service_role`, placeholders `+000000000`, menciones personales de "Hablar con Jesus", handlers de teclado y `preventDefault`.
- Se revisaron flujos criticos de acceso en `accessService`, `AdminAccessPage`, `AdminRecompensasPage`, `AdminPaymentReceiptsPage` y `/mis-contactos`.
- Se probaron rutas principales en navegador local con servidor dev levantado: `/`, `/catalogo`, `/precios`, `/login`, `/mis-contactos`, `/publica-tu-servicio`, `/politica-privacidad`, `/terminos`, `/soporte`, `/admin`, `/admin/contactos`, `/admin/accesos`, `/admin/recompensas`, `/admin/comprobantes`.

## Errores encontrados

- El chat usaba `window.location.href` para navegar a rutas internas como catalogo/auth. Eso provocaba recarga completa de la SPA y perdida de fluidez.
- `/mis-contactos` hacia refresh silencioso cada vez que la pestana volvia a estar visible. Aunque no mostraba loader global, podia sentirse como parpadeo o actualizacion innecesaria.
- El chat y Admin Comprobantes todavia tenian fallback visual hacia `attachment_url`. Eso podia mostrar URLs expiradas si venian de registros antiguos.
- `readAutofillProfile` intentaba leer columnas opcionales `display_name` y `whatsapp` en cada ruta. Si esas columnas no existen en Supabase, generaba warnings repetidos en consola.
- Admin Contactos mezclaba contactos publicables, restringidos, placeholders y sin telefono sin filtros directos de revision. Eso hacia dificil auditar los 67 registros reservados o corregir telefonos importados como `+000000000...`.

## Correcciones aplicadas

- `ChatWidget` ahora usa `useNavigate()` para navegacion interna. Ya no recarga toda la pagina al ir a catalogo/auth desde el chat.
- `ChatWidget` y `AdminPaymentReceiptsPage` ahora muestran comprobantes usando signed URLs generadas desde `attachment_path`. `attachment_url` deja de ser fuente visual principal.
- `/mis-contactos` ahora limita el refresh al volver de otra pestana con un cooldown de 90 segundos y solo fuerza refresh inmediato cuando la pagina vuelve desde bfcache.
- `readAutofillProfile` recuerda si las columnas extendidas de perfil no existen y deja de repetir warnings en cada lectura durante la sesion.
- Se confirmo que los handlers `preventDefault` restantes son especificos de submit, Escape o Enter/Ctrl+Enter. No se detecto bloqueo global de Space.
- Se confirmo que no quedan `window.location.reload`, `window.location.href`, `service_role`, `+000000000` ni "Hablar con Jesus" en `src`.
- Admin Contactos ahora tiene filtros clicables por Total, Publicables, Restringidos, Sin categoria, Sin telefono util y Completos.
- La tabla admin muestra `raw_phone`, `phone_status`, `visibility`, estado, notas y datos de revision para contactos sensibles o incompletos.
- El modal de edicion permite corregir nombre, telefono, `raw_phone`, carpeta, tags, estado, visibilidad, `is_public`, `phone_status`, nota interna y nota de importacion.
- El boton de aprobar valida telefono real, carpeta valida y descripcion antes de publicar. Si algo falta, no muestra exito falso.
- Se agrego migracion para permitir estados `missing`, `invalid`, `placeholder_bug` y visibilidad `admin_only`, y para marcar placeholders `+000000000...` como revision privada.

## Archivos modificados

- `src/components/chat/ChatWidget.tsx`
- `src/pages/MyContactsPage.tsx`
- `src/pages/admin/AdminPaymentReceiptsPage.tsx`
- `src/lib/autofillProfile.ts`
- `src/pages/admin/AdminContactsPage.tsx`
- `src/lib/supabaseClient.ts`
- `src/supabase/migrations/025_contacts_review_statuses.sql`
- `BUG_FIX_REPORT.md`

## Rutas probadas

Prueba automatizada ligera en navegador local:

- `/`
- `/catalogo`
- `/precios`
- `/login`
- `/mis-contactos`
- `/publica-tu-servicio`
- `/politica-privacidad`
- `/terminos`
- `/soporte`
- `/admin`
- `/admin/contactos`
- `/admin/accesos`
- `/admin/recompensas`
- `/admin/comprobantes`

Resultado: no se encontro pantalla rota ni overflow horizontal global en la pasada de rutas. Las rutas privadas/admin mostraron estados de verificacion de permisos en esta sesion, por lo que no se confirma aqui una operacion admin completa con datos reales.

## Seguridad y permisos

- La fuente oficial de accesos sigue siendo `public.user_category_access`.
- `grantCategoryAccess` verifica post-escritura que el acceso activo exista para el usuario destino y las carpetas solicitadas antes de devolver exito.
- `/mis-contactos` sigue leyendo accesos activos desde Supabase, no desde localStorage como fuente principal.
- Los telefonos completos siguen limitados a vistas desbloqueadas/admin. Los previews publicos usan telefono enmascarado.
- The Vault sigue excluido del catalogo publico por `sortOrder === 18`.

## SQL pendiente o recomendado

Se creo una migracion nueva en esta fase:

- `src/supabase/migrations/025_contacts_review_statuses.sql`: amplia `phone_status` y `visibility`, agrega columnas de auditoria si faltan, y marca placeholders `+000000000...` como revision privada.

Pendientes/recomendadas si aun no se ejecutaron en Supabase:

- `src/supabase/migrations/013_chat_receipts_24h.sql`: columnas de adjuntos y expiracion del chat.
- `src/supabase/migrations/017_chat_attachment_path_metadata.sql`: migra metadatos hacia `attachment_path` para signed URLs privadas.
- `src/supabase/migrations/019_user_category_access_unified.sql`: columnas opcionales de trazabilidad de accesos (`access_type`, `source`, `note`, etc.).
- `src/supabase/migrations/021_contacts_import_phone_audit.sql`: columnas base para auditoria de importacion de contactos.
- `src/supabase/migrations/025_contacts_review_statuses.sql`: estados de revision ampliados para Admin Contactos.
- Si quieres eliminar el warning incluso despues de recargar la app, agrega columnas opcionales a `profiles`: `display_name text` y `whatsapp text`. El codigo ya funciona sin ellas.

## Riesgos o revisiones posteriores

- No se hicieron operaciones destructivas ni cambios de esquema automaticos.
- No se probo activacion real de accesos con un usuario cliente real desde el navegador durante esta fase; el codigo de servicio si mantiene verificacion post-grant.
- El build muestra advertencia de bundle grande de Vite. No bloquea produccion, pero se puede optimizar luego con code splitting.
