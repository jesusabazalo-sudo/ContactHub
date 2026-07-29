import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Benefits from '../components/landing/Benefits';
import CategoryPreview from '../components/landing/CategoryPreview';
import FAQPreview from '../components/landing/FAQPreview';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import PricingPreview from '../components/landing/PricingPreview';
import SocialProof from '../components/landing/SocialProof';
import PublicReviews from '../components/reviews/PublicReviews';
import { useAuth } from '../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

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
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const suggestion = answers?.busca ? suggestions[answers.busca] : null;

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
      <div className="hidden sm:block">
        <SocialProof />
      </div>
      <div className="section-divider hidden sm:block" aria-hidden="true" />
      {suggestion ? <SuggestionBanner suggestion={suggestion} /> : null}
      <div className="hidden sm:block">
        <HowItWorks />
      </div>
      <CategoryPreview />
      <div className="hidden sm:block">
        <Benefits />
      </div>
      <PricingPreview />
      <FAQPreview />
      <PublicReviews />
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
          <div className="text-[13px] text-content/70">Basado en lo que buscas:</div>
          <div className="text-sm font-bold text-content sm:text-[15px]">
            Te recomendamos explorar <span className="text-brand-text">{suggestion.name}</span>
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
