import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Benefits from '../components/landing/Benefits';
import CategoryPreview from '../components/landing/CategoryPreview';
import FAQPreview from '../components/landing/FAQPreview';
import FinalCTA from '../components/landing/FinalCTA';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import PricingPreview from '../components/landing/PricingPreview';
import PromoSection from '../components/landing/PromoSection';
import MissionsSection from '../components/missions/MissionsSection';
import PublicReviews from '../components/reviews/PublicReviews';
import { applyOfficialCategoryDisplay, formatCategoryOptionLabel, sortByOfficialOrder } from '../data/officialCategories';
import { useAuth } from '../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { maskPhone } from '../utils/phone';

type TrialCategory = { id: string; name: string; slug: string; icon: string; sort_order?: number | null };
type TrialContact = { id: string; name: string; phone: string | null; phone_masked: string };
type OnboardingAnswers = { busca?: string; uso?: string; contacto?: string };

const suggestions: Record<string, { slug: string; name: string }> = {
  'Herramientas de IA': { slug: 'inteligencia-artificial-tech', name: 'IA MASTERS' },
  'Cursos y recursos': { slug: 'educacion-cursos-libros', name: 'KNOWLEDGE VAULT' },
  'Proveedores para vender': { slug: 'power-money-negocios-escalables', name: 'CASH FLOW' },
  'Contactos de servicios': { slug: 'corporate-negocios', name: 'ELITE BUSINESS' },
  Entretenimiento: { slug: 'gaming-streaming-entretenimiento', name: 'ENTERPLAY' },
  'Todo me interesa': { slug: 'varios-bonus', name: 'MISC BONUS' },
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const suggestion = answers?.busca ? suggestions[answers.busca] : null;

  useEffect(() => {
    function openTrial() {
      if (!user) {
        navigate('/auth?redirect=/?trial=1');
        return;
      }
      setIsTrialOpen(true);
    }
    window.addEventListener('contacthub:open-trial', openTrial);
    if (searchParams.get('trial') === '1' && user) setIsTrialOpen(true);
    if (searchParams.get('trial') === '1' && !user) navigate('/auth?redirect=/?trial=1');
    return () => window.removeEventListener('contacthub:open-trial', openTrial);
  }, [navigate, searchParams, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('animate-fade-in-up')),
      { threshold: 0.18 },
    );
    document.querySelectorAll('section').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadSuggestion() {
      if (!user?.id || !supabase || !isSupabaseConfigured) {
        setAnswers(null);
        return;
      }
      try {
        const client = supabase as unknown as { from: (table: string) => any };
        const { data, error } = await client.from('profiles').select('onboarding_answers').eq('id', user.id).maybeSingle();
        if (error) {
          console.warn('No se pudo cargar onboarding_answers:', error.message);
          setAnswers(null);
          return;
        }
        setAnswers((data?.onboarding_answers ?? null) as OnboardingAnswers | null);
      } catch (error) {
        console.warn('No se pudo cargar sugerencia:', error);
        setAnswers(null);
      }
    }
    void loadSuggestion();
  }, [user?.id]);

  return (
    <>
      <Hero />
      {suggestion ? <SuggestionBanner suggestion={suggestion} /> : null}
      <Benefits />
      <CategoryPreview />
      <HowItWorks />
      <MissionsSection />
      <PromoSection />
      <PricingPreview />
      <FAQPreview />
      <PublicReviews />
      <FinalCTA />
      {isTrialOpen ? <TrialModal onClose={() => setIsTrialOpen(false)} /> : null}
    </>
  );
}

function SuggestionBanner({ suggestion }: { suggestion: { slug: string; name: string } }) {
  const navigate = useNavigate();
  return (
    <div className="container-shell">
      <div className="my-4 flex flex-col gap-3 rounded-xl border border-brand-400/20 bg-brand-400/10 p-4 sm:flex-row sm:items-center sm:px-5">
        <span className="text-2xl">🎯</span>
        <div className="min-w-0">
          <div className="text-[13px] text-white/70">Basado en lo que buscas:</div>
          <div className="text-sm font-bold text-white sm:text-[15px]">
            Te recomendamos explorar <span className="text-brand-400">{suggestion.name}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/catalogo/${suggestion.slug}`)}
          className="focus-ring rounded-lg bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950 transition hover:bg-white sm:ml-auto"
        >
          Ver carpeta →
        </button>
      </div>
    </div>
  );
}

function TrialModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'category' | 'contacts' | 'done' | 'used'>('category');
  const [categories, setCategories] = useState<TrialCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TrialCategory | null>(null);
  const [contacts, setContacts] = useState<TrialContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    async function load() {
      if (!user?.id || !supabase || !isSupabaseConfigured) return;
      setIsLoading(true);
      try {
        const { data: trial } = await supabase.from('trial_claims').select('id').eq('user_id', user.id).maybeSingle();
        if (trial) {
          setStep('used');
          return;
        }
        const categoriesWithSort = await supabase.from('categories').select('id,name,slug,icon,sort_order').eq('is_active', true).order('sort_order').order('name');
        const categoriesResult = categoriesWithSort.error?.message.toLowerCase().includes('sort_order')
          ? await supabase.from('categories').select('id,name,slug,icon').eq('is_active', true).order('name')
          : categoriesWithSort;
        const { data, error: categoriesError } = categoriesResult;
        if (categoriesError) throw categoriesError;
        setCategories(sortByOfficialOrder((data ?? []).map((category) => applyOfficialCategoryDisplay(category))));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la prueba.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [user?.id]);

  async function chooseCategory(category: TrialCategory) {
    if (!supabase) return;
    setSelectedCategory(category);
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: contactsError } = await supabase
        .from('contacts')
        .select('id,name,phone,phone_masked')
        .eq('category_id', category.id)
        .or('status.eq.active,status.is.null')
        .or('risk_level.neq.prohibited,risk_level.is.null')
        .order('created_at', { ascending: false })
        .limit(15);
      if (contactsError) throw contactsError;
      setContacts(data ?? []);
      setStep('contacts');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar contactos.');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleContact(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }

  async function claimTrial() {
    if (!user?.id || !supabase || !selectedCategory) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('trial_claims').insert({ user_id: user.id, contact_ids: selectedIds, claimed_at: new Date().toISOString() });
      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          toast.info('Ya usaste tu prueba.');
          setStep('used');
          return;
        }
        throw insertError;
      }
      setStep('done');
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'No se pudo activar tu prueba.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-line bg-ink-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{step === 'category' ? 'Elige una carpeta para tu prueba' : step === 'contacts' ? 'Elige 3 contactos' : 'Prueba gratuita'}</h2>
            <p className="mt-2 text-sm text-gray-400">Verás 3 contactos reales. Solo puedes hacer esto una vez.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-line px-3 py-1 text-white">X</button>
        </div>
        {error ? <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{error}<button type="button" onClick={() => setError(null)} className="ml-3 underline">Reintentar</button></div> : null}
        {isLoading ? <p className="mt-6 text-sm text-gray-300">Cargando...</p> : null}
        {step === 'category' ? (
          <div className="mt-6 grid max-h-[60vh] gap-3 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <button key={category.id} type="button" onClick={() => void chooseCategory(category)} className="focus-ring rounded-lg border border-line bg-panel p-4 text-left text-white hover:border-brand-400/40">
                <span className="text-xs text-brand-400">{category.icon}</span>
                <p className="mt-2 font-semibold">{formatCategoryOptionLabel(category, categories.indexOf(category))}</p>
              </button>
            ))}
          </div>
        ) : null}
        {step === 'contacts' ? (
          <div className="mt-6">
            <p className="mb-4 text-sm font-semibold text-brand-400">{selectedIds.length} / 3 seleccionados</p>
            <div className="grid max-h-[50vh] gap-2 overflow-auto">
              {contacts.map((contact) => {
                const checked = selectedSet.has(contact.id);
                return (
                  <label key={contact.id} className={`flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3 ${!checked && selectedIds.length >= 3 ? 'opacity-50' : ''}`}>
                    <span className="text-sm text-white">
                      {contact.name} <span className="font-mono text-gray-500">{maskPhone(contact.phone ?? contact.phone_masked)}</span>
                    </span>
                    <input type="checkbox" checked={checked} disabled={!checked && selectedIds.length >= 3} onChange={() => toggleContact(contact.id)} />
                  </label>
                );
              })}
            </div>
            <button type="button" disabled={selectedIds.length !== 3 || isLoading} onClick={() => void claimTrial()} className="focus-ring mt-5 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-60">
              Desbloquear mis 3 contactos
            </button>
          </div>
        ) : null}
        {step === 'done' && selectedCategory ? (
          <div className="mt-8 rounded-xl border border-brand-400/30 bg-brand-400/10 p-6 text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-3 font-display text-2xl font-bold text-white">¡Listo! Ya puedes ver tus 3 contactos en {selectedCategory.name}</p>
            <button type="button" onClick={() => navigate(`/catalogo/${selectedCategory.slug}`)} className="mt-5 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950">Ir a la carpeta</button>
          </div>
        ) : null}
        {step === 'used' ? (
          <div className="mt-8 text-center">
            <p className="font-display text-2xl font-bold text-white">Ya reclamaste tu prueba.</p>
            <button type="button" onClick={() => navigate('/precios')} className="mt-5 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950">Ver precios</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
