# Migraciones de ContactHub

Esta es la **única** fuente de migraciones SQL del proyecto. (Antes existía un
árbol duplicado en `src/supabase/migrations/`; se consolidó aquí. Los archivos
con el mismo nombre en ambos árboles eran idénticos byte a byte, así que la
consolidación no cambió ningún SQL.)

## Cómo aplicar

Ejecuta los archivos **en orden numérico** en el SQL Editor de Supabase, o con
la CLI (`supabase db push`). Todos están escritos para ser idempotentes
(`create ... if not exists`, `add column if not exists`, `create or replace`,
`drop policy if exists`), por lo que es seguro volver a ejecutarlos.

## Orden

```
001_contacthub_security_base.sql
002_customer_crm.sql
003_category_sort_order.sql
004_sync_contacts_count.sql
005_chat_support.sql
006_official_category_order.sql
006_security_hardening.sql        # ← ver nota sobre el número 006
007_reviews_rewards.sql
008_official_folder_order_display.sql
009_payment_receipts.sql
010_update_contact_country_flags.sql
011_profiles_onboarding.sql
011_seed_official_access_categories.sql   # ← ver nota sobre el número 011
012_profiles_online_tracking.sql
013_chat_receipts_24h.sql
014_official_folders_security_audit.sql
015_admin_contacts_management.sql
016_storage_comprobantes_policies.sql
017_chat_attachment_path_metadata.sql
018_profiles_autofill.sql
019_user_category_access_unified.sql
020_contacts_safe_backup_archive.sql
021_contacts_import_phone_audit.sql
022_access_target_integrity_rls.sql
023_my_contacts_access_read_rls.sql
024_service_submissions.sql
025_contacts_review_statuses.sql
```

## Números duplicados (preexistentes)

Hay dos pares de archivos que comparten prefijo numérico. Son migraciones
**independientes** entre sí (tocan objetos distintos) y se conservan con su
nombre original para no desincronizar bases de datos donde ya se aplicaron. El
orden relativo dentro de cada par no es crítico:

- `006_official_category_order.sql` y `006_security_hardening.sql`
- `011_profiles_onboarding.sql` y `011_seed_official_access_categories.sql`

> Para una BD nueva, basta con ejecutarlos en el orden alfabético de la lista de
> arriba.

## Verificación

`../verification/contacts_1048_audit.sql` es un script de **auditoría** (no una
migración): consulta el estado de los contactos importados. No modifica el
esquema.
