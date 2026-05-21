# ContactHub

Directorio digital de contactos comerciales organizados en 25 categorías.

## Instalación
npm install
cp .env.example .env.local
# Edita .env.local con tus keys de Supabase
npm run dev

## Producción
npm run build

## Activar admin
En Supabase SQL Editor:
select public.promote_user_to_admin_by_email('tu@email.com');

## Migraciones
Ejecutar en orden en Supabase SQL Editor:
supabase/migrations/001_contacthub_security_base.sql
supabase/migrations/002_customer_crm.sql
supabase/migrations/003_category_sort_order.sql
supabase/migrations/004_sync_contacts_count.sql
supabase/migrations/005_chat_support.sql

## Stack
React + TypeScript + Vite + Tailwind + Supabase
