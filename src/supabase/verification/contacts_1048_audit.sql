-- Read-only audit for the final ContactHub contact import.
-- This file does not update, archive, or delete any data.

-- Active admin total (publicable + restricted review).
SELECT count(*) AS active_admin_total
FROM public.contacts
WHERE status IN ('active', 'review');

-- Totals by folder.
SELECT category_id, count(*) AS contacts
FROM public.contacts
WHERE status IN ('active', 'review')
GROUP BY category_id
ORDER BY category_id;

-- Uncategorized contacts.
SELECT count(*) AS uncategorized
FROM public.contacts
WHERE status IN ('active', 'review')
  AND category_id IS NULL;

-- Totals by workflow status.
SELECT status, count(*) AS contacts
FROM public.contacts
WHERE status IN ('active', 'review')
GROUP BY status
ORDER BY status;

-- Placeholder phone audit. The expected result is zero.
SELECT count(*) AS placeholder_phones
FROM public.contacts
WHERE status IN ('active', 'review')
  AND phone ~ '^\+?0{6,}';

-- Run after migration 021_contacts_import_phone_audit.sql is applied.
-- SELECT visibility, is_public, phone_status, count(*) AS contacts
-- FROM public.contacts
-- WHERE status IN ('active', 'review')
-- GROUP BY visibility, is_public, phone_status
-- ORDER BY visibility, is_public, phone_status;
