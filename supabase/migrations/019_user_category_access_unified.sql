-- Unifica metadatos de accesos para activaciones manuales, regalos, recompensas y comprobantes.
-- Ejecutar en Supabase SQL Editor si quieres trazabilidad completa en user_category_access.

ALTER TABLE public.user_category_access
ADD COLUMN IF NOT EXISTS access_type text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS category_slug text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.user_category_access
SET access_type = COALESCE(access_type, 'manual'),
    updated_at = COALESCE(updated_at, created_at, now())
WHERE access_type IS NULL
   OR updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_category_access_user_status
  ON public.user_category_access(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_category_access_category_status
  ON public.user_category_access(category_id, status);

-- La app usa upsert por user_id + category_id.
-- Si tu tabla no tiene esta restricción y no existen duplicados, puedes ejecutar:
-- ALTER TABLE public.user_category_access
-- ADD CONSTRAINT user_category_access_user_id_category_id_key UNIQUE (user_id, category_id);
