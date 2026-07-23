import { ArrowRight, Clock, FolderOpen, Search, Sparkles, UserRoundSearch, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CACHE_TTL, queryCache } from '../../lib/queryCache';
import { normalizeSearchText, searchCategories, searchContacts } from '../../lib/searchUtils';
import { getCatalogCategories, getCatalogCategoryPreviews } from '../../services/catalogService';
import type { Category, PreviewContact } from '../../types';

const suggestions = ['IA', 'libros', 'proveedores', 'fitness', 'marketing', 'streaming', 'cocina', 'música', 'diseño'];
const RECENT_SEARCHES_KEY = 'contacthub_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = readRecentSearches().filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

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
          <mark key={`${part}-${index}`} className="rounded bg-brand-400/20 px-0.5 text-brand-text">
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
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());
  const debouncedQuery = useDebouncedValue(query, 200);

  function rememberSearch(term: string) {
    const next = writeRecentSearches(term);
    if (next) setRecentSearches(next);
  }

  function clearRecentSearches() {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  }

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
        const allCategories = await queryCache.withCache('catalog:categories', CACHE_TTL.categories, getCatalogCategories);
        const loadedCategories = allCategories.filter((category) => category.sortOrder !== 18);
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
        <Search className="h-5 w-5 shrink-0 text-brand-text" />
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
              rememberSearch(query);
              navigate(`/catalogo/${categoryResults[0].slug}`);
              setIsOpen(false);
            }
          }}
          placeholder="Busca libros, IA, proveedores, cursos, fitness, streaming..."
          className="min-w-0 flex-1 bg-transparent text-base text-content outline-none placeholder:text-content-muted sm:text-lg"
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} className="focus-ring rounded-full p-2 text-content-muted transition hover:bg-muted hover:text-content" aria-label="Limpiar búsqueda">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      {isOpen ? (
        <div className="global-search-results absolute left-0 right-0 top-[calc(100%+10px)] max-h-[min(68vh,560px)] overflow-y-auto p-3 sm:p-4">
          {!normalizedQuery ? (
            <div>
              <div className="flex items-center gap-2 px-2 text-sm text-content-secondary">
                <Sparkles className="h-4 w-4 text-brand-text" />
                Busca por palabra clave, categoría o necesidad.
              </div>
              {recentSearches.length ? (
                <section className="mt-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-content-secondary">
                      <Clock className="h-4 w-4 text-brand-text" />
                      Búsquedas recientes
                    </h3>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="focus-ring rounded px-1.5 py-0.5 text-[11px] font-semibold text-content-muted transition hover:text-content"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 px-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => chooseSuggestion(term)}
                        className="focus-ring rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-content-secondary transition hover:border-brand-400/35 hover:text-content"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <SearchSuggestions onChoose={chooseSuggestion} />
            </div>
          ) : isTyping || isLoading ? (
            <div className="flex items-center gap-3 px-3 py-5 text-sm text-content-secondary">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400/25 border-t-brand-400" />
              Buscando...
            </div>
          ) : hasResults ? (
            <div className="space-y-5">
              <p className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-content-muted">
                Resultados para: <span className="normal-case tracking-normal text-brand-text">{debouncedQuery}</span>
              </p>
              {categoryResults.length ? (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.14em] text-content-secondary">
                    <FolderOpen className="h-4 w-4 text-brand-text" />
                    Carpetas relacionadas
                  </h3>
                  <div className="grid gap-2">
                    {categoryResults.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          rememberSearch(debouncedQuery);
                          navigate(`/catalogo/${category.slug}`);
                          setIsOpen(false);
                        }}
                        className="focus-ring flex w-full items-center gap-3 rounded-lg border border-border bg-muted p-3 text-left transition hover:border-brand-400/35 hover:bg-brand-400/[0.07]"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-content"><Highlight text={category.name} query={debouncedQuery} /></span>
                          <span className="mt-1 line-clamp-1 block text-xs text-content-secondary">{category.shortDescription}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-brand-text" />
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {contactResults.length ? (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.14em] text-content-secondary">
                    <UserRoundSearch className="h-4 w-4 text-brand-text" />
                    Contactos disponibles
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {contactResults.map((contact) => (
                      <button
                        key={`${contact.categoryId}-${contact.id}`}
                        type="button"
                        onClick={() => {
                          rememberSearch(debouncedQuery);
                          navigate(`/catalogo/${contact.categorySlug}`);
                          setIsOpen(false);
                        }}
                        className="focus-ring rounded-lg border border-border bg-muted p-3 text-left transition hover:border-brand-400/30"
                      >
                        <span className="line-clamp-1 text-sm font-bold text-content"><Highlight text={contact.name} query={debouncedQuery} /></span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-content-secondary">{contact.description || contact.categoryName}</span>
                        <span className="mt-2 block text-[11px] font-semibold text-brand-text">Disponible con acceso activo</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <SearchSuggestions onChoose={chooseSuggestion} />
            </div>
          ) : (
            <div className="px-2 py-3">
              <h3 className="text-base font-bold text-content">No encontramos resultados para esta búsqueda.</h3>
              <p className="mt-2 text-sm leading-6 text-content-secondary">Prueba con una necesidad más amplia o explora las opciones disponibles.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link to="/catalogo" className="focus-ring rounded-lg bg-brand-400 px-3 py-2.5 text-center text-xs font-bold text-ink-950">Ver catálogo</Link>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: `Hola, busqué "${query}" y necesito orientación.` } }))} className="focus-ring rounded-lg border border-border bg-muted px-3 py-2.5 text-xs font-bold text-content">Hablar con soporte</button>
                <Link to="/publica-tu-servicio" className="focus-ring rounded-lg border border-border bg-muted px-3 py-2.5 text-center text-xs font-bold text-content">Publicar servicio</Link>
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
    <section className="mt-4 border-t border-border pt-4">
      <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-content-muted">También podrías buscar</p>
      <div className="mt-3 flex flex-wrap gap-2 px-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onChoose(suggestion)} className="focus-ring rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-content-secondary transition hover:border-brand-400/35 hover:text-content">
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
