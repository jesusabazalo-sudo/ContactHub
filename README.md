# ContactHub

Directorio digital de contactos comerciales organizados por categorías.

## Instalación

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus keys de Supabase
npm run dev
```

## Producción

```bash
npm run build
```

## Activar admin

En Supabase SQL Editor:

```sql
select public.promote_user_to_admin_by_email('tu@email.com');
```

## Migraciones

Todas las migraciones viven en una única carpeta: [`supabase/migrations/`](supabase/migrations/).
Ejecútalas **en orden numérico** en el SQL Editor de Supabase (o con `supabase db push`).
El orden completo y las notas (incluidos los dos pares de archivos que comparten
número de prefijo) están documentados en
[`supabase/migrations/README.md`](supabase/migrations/README.md).

## Stack

React + TypeScript + Vite + Tailwind CSS + Supabase
