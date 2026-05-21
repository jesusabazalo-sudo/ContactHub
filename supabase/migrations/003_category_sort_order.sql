-- ContactHub - Category ordering for admin contact workflows.
-- Run this complete file in Supabase SQL Editor.

begin;

alter table public.categories
add column if not exists sort_order integer;

update public.categories set sort_order = 1 where name = 'Corporate & Negocios';
update public.categories set sort_order = 2 where name = 'Inteligencia Artificial & Tech';
update public.categories set sort_order = 3 where name = 'Educación, Cursos & Libros';
update public.categories set sort_order = 4 where name = 'Fitness, Salud & Nutrición';
update public.categories set sort_order = 5 where name = 'Diseño, Creatividad & Recursos';
update public.categories set sort_order = 6 where name = 'Gaming, Streaming & Entretenimiento';
update public.categories set sort_order = 7 where name = 'Marketing Digital & Crecimiento';
update public.categories set sort_order = 8 where name = 'Deportes, Manualidades & Hobbies';
update public.categories set sort_order = 9 where name = 'Reparaciones Técnicas & Oficios';
update public.categories set sort_order = 10 where name = 'Espiritualidad, Familia & Bienestar';
update public.categories set sort_order = 11 where name = 'Varios & Bonus';
update public.categories set sort_order = 12 where name = 'Power Money & Negocios Escalables';
update public.categories set sort_order = 13 where name = 'Mentes Maestras & Alto Rendimiento';
update public.categories set sort_order = 14 where name = 'Content Kings & Viral Lab';
update public.categories set sort_order = 15 where name = 'Audio Masters & Música';
update public.categories set sort_order = 16 where name = 'Gamer Elite & Vicios Digitales';
update public.categories set sort_order = 17 where name = 'Herramientas Digitales';
update public.categories set sort_order = 18 where name = 'Importación & Mayoristas';
update public.categories set sort_order = 19 where name = 'Tecnología & Gadgets';
update public.categories set sort_order = 20 where name = 'Moda, Belleza & Estilo';
update public.categories set sort_order = 21 where name = 'Servicios Locales';
update public.categories set sort_order = 22 where name = 'Recursos para Emprendedores';
update public.categories set sort_order = 23 where name = 'Cursos Profesionales';
update public.categories set sort_order = 24 where name = 'Plantillas, Sistemas & Automatización';
update public.categories set sort_order = 25 where name = 'Bonus / Sin Clasificar';

create index if not exists idx_categories_sort_order on public.categories(sort_order, name);

commit;
