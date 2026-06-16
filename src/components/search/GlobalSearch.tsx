import { ArrowRight, FolderOpen, Search, Sparkles, UserRoundSearch, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { normalizeSearchText, searchCategories, searchContacts } from '../../lib/searchUtils';
import { getCatalogCategories, getCatalogCategoryPreviews } from '../../services/catalogService';
import type { Category, PreviewContact } from '../../types';

const suggestions = ['IA', 'libros', 'proveedores', 'fitness', 'marketing', 'streaming', 'cocina', 'música', 'diseño'];

type PublicContactResult = PreviewContact & {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
};

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query.split(/\s+/).filter((token) => token.length > 1).map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!tokens.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${tokens.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        tokens.some((token) => new RegExp(`^${token}$`, 'i').test(part)) ? (
          <mark key={`${part}-${index}`} className="rounded bg-brand-400/20 px-0.5 text-brand-200">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<PublicContactResult[]>([]);
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (hasLoaded || normalizeSearchText(debouncedQuery).length < 2) return;

    async function loadPublicSearchData() {
      setIsLoading(true);
      try {
        const loadedCategories = (await getCatalogCategories()).filter((category) => category.sortOrder !== 18);
        const previews = await getCatalogCategoryPreviews({
          categoryIds: loadedCategories.map((category) => category.id),
          isRegistered: false,
          fullAccessCategoryIds: new Set(),
        });
        setCategories(loadedCategories);
        setContacts(
          loadedCategories.flatMap((category) =>
            (previews.get(category.id) ?? []).map((contact) => ({
              ...contact,
              phone: null,
              phoneMasked: '',
              categoryId: category.id,
              categoryName: category.name,
              categorySlug: category.slug,
            })),
          ),
        );
        setHasLoaded(true);
      } catch (error) {
        if (import.meta.env.DEV) console.error('GlobalSearch:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadPublicSearchData();
  }, [debouncedQuery, hasLoaded]);

  const categoryResults = useMemo(
    () => searchCategories(debouncedQuery, categories).slice(0, 4),
    [categories, debouncedQuery],
  );
  const contactResults = useMemo(
    () => searchContacts(debouncedQuery, contacts).slice(0, 5),
    [contacts, debouncedQuery],
  );
  const normalizedQuery = normalizeSearchText(query);
  const isTyping = query !== debouncedQuery;
  const hasResults = categoryResults.length > 0 || contactResults.length > 0;

  function chooseSuggestion(value: string) {
    setQuery(value);
    setIsOpen(true);
  }

  return (
    <div ref={rootRef} className="relative z-30 mx-auto mt-8 w-full max-w-3xl text-left">
      <label className="global-search-shell flex min-h-14 items-center gap-3 px-4 sm:min-h-16 sm:px-5">
        <Search className="h-5 w-5 shrink-0 text-brand-400" />
        <span className="sr-only">¿Qué estás buscando?</span>
        <input
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
            if (event.key === 'Enter' && categoryResults[0]) {
              event.preventDefault();
              navigate(`/catalogo/${categoryResults[0].slug}`);
              setIsOpen(false);
            }
          }}
          placeholder="Busca libros, IA, proveedores, cursos, fitness, streaming..."
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-lg"
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} className="focus-ring rounded-full p-2 text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Limpiar búsqueda">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      {isOpen ? (
        <div className="global-search-results absolute left-0 right-0 top-[calc(100%+10px)] max-h-[min(68vh,560px)] overflow-y-auto p-3 sm:p-4">
          {!normalizedQuery ? (
            <div>
              <div className="flex items-center gap-2 px-2 text-sm text-slate-300">
                <Sparkles className="h-4 w-4 text-brand-400" />
                Busca por palabra clave, categoría o necesidad.
              </div>
              <SearchSuggestions onChoose={chooseSuggestion} />
            </div>
          ) : isTyping || isLoading ? (
            <div className="flex items-center gap-3 px-3 py-5 text-sm text-slate-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400/25 border-t-brand-400" />
              Buscando...
            </div>
          ) : hasResults ? (
            <div className="space-y-5">
              <p className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Resultados para: <span className="normal-case tracking-normal text-brand-300">{debouncedQuery}</span>
              </p>
              {categoryResults.length ? (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    <FolderOpen className="h-4 w-4 text-brand-400" />
                    Carpetas relacionadas
                  </h3>
                  <div className="grid gap-2">
                    {categoryResults.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          navigate(`/catalogo/${category.slug}`);
                          setIsOpen(false);
                        }}
                        className="focus-ring flex w-full items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-brand-400/35 hover:bg-brand-400/[0.07]"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-white"><Highlight text={category.name} query={debouncedQuery} /></span>
                          <span className="mt-1 line-clamp-1 block text-xs text-slate-400">{category.shortDescription}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-brand-400" />
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {contactResults.length ? (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    <UserRoundSearch className="h-4 w-4 text-brand-400" />
                    Contactos disponibles
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {contactResults.map((contact) => (
                      <button
                        key={`${contact.categoryId}-${contact.id}`}
                        type="button"
                        onClick={() => {
                          navigate(`/catalogo/${contact.categorySlug}`);
                          setIsOpen(false);
                        }}
                        className="focus-ring rounded-lg border border-white/[0.07] bg-black/15 p-3 text-left transition hover:border-brand-400/30"
                      >
                        <span className="line-clamp-1 text-sm font-bold text-white"><Highlight text={contact.name} query={debouncedQuery} /></span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-400">{contact.description || contact.categoryName}</span>
                        <span className="mt-2 block text-[11px] font-semibold text-brand-300">Disponible con acceso activo</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <SearchSuggestions onChoose={chooseSuggestion} />
            </div>
          ) : (
            <div className="px-2 py-3">
              <h3 className="text-base font-bold text-white">No encontramos resultados para esta búsqueda.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Prueba con una necesidad más amplia o explora las opciones disponibles.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link to="/catalogo" className="focus-ring rounded-lg bg-brand-400 px-3 py-2.5 text-center text-xs font-bold text-ink-950">Ver catálogo</Link>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: `Hola, busqué "${query}" y necesito orientación.` } }))} className="focus-ring rounded-lg border border-line bg-white/5 px-3 py-2.5 text-xs font-bold text-white">Hablar con soporte</button>
                <Link to="/publica-tu-servicio" className="focus-ring rounded-lg border border-line bg-white/5 px-3 py-2.5 text-center text-xs font-bold text-white">Publicar servicio</Link>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchSuggestions({ onChoose }: { onChoose: (value: string) => void }) {
  return (
    <section className="mt-4 border-t border-line pt-4">
      <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">También podrías buscar</p>
      <div className="mt-3 flex flex-wrap gap-2 px-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onChoose(suggestion)} className="focus-ring rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-brand-400/35 hover:text-white">
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
