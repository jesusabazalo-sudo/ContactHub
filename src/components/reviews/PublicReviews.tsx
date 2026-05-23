import { MessageCircle, Send, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import { sanitizeText } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ReviewRow = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const useCases = [
  {
    rating: 5,
    label: 'Exploró el catálogo',
    source: 'Llegó por redes',
    intent: 'Buscaba proveedores',
    text: 'Buscaba contactos para avanzar con mi negocio y me sirvió ver las categorías antes de comprar.',
  },
  {
    rating: 5,
    label: 'Acceso gratis para explorar',
    source: 'Recomendación',
    intent: 'Interés en educación',
    text: 'Me gustó que primero pueda explorar y entender qué hay dentro.',
  },
  {
    rating: 4,
    label: 'Historias de uso',
    source: 'TikTok',
    intent: 'Explorar oportunidades',
    text: 'Entré por curiosidad, pero encontré carpetas que sí iban con lo que estaba buscando.',
  },
  {
    rating: 5,
    label: 'Meta mejor ubicada',
    source: 'Búsqueda',
    intent: 'Orientación',
    text: 'Si no sabes exactamente qué necesitas, el catálogo te ayuda a ubicar mejor tu meta.',
  },
];

function reviewsClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase as unknown as { from: (table: string) => any };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-300" aria-label={`${value} estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < value ? 'fill-current' : 'opacity-30'}`} />
      ))}
    </span>
  );
}

function openChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function PublicReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadReviews() {
    const client = reviewsClient();
    if (!client) return;
    const { data, error } = await client
      .from('public_reviews')
      .select('id,user_id,display_name,is_anonymous,rating,comment,status,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) {
      console.warn('No se pudieron cargar reseñas:', error);
      return;
    }
    setReviews(data ?? []);
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [comment]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const visibleCards = reviews.length
    ? reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        label: review.is_anonymous ? 'Comentario aprobado' : review.display_name || 'Usuario ContactHub',
        source: 'Comentario real',
        intent: 'Experiencia en ContactHub',
        text: review.comment,
      }))
    : useCases.map((item) => ({ ...item, id: item.label }));

  async function submitReview() {
    const client = reviewsClient();
    if (!client || !user?.id) {
      toast.info('Inicia sesión para dejar tu comentario.');
      return;
    }

    const safeComment = sanitizeText(comment, 800);
    if (!safeComment) {
      toast.error('Escribe un comentario breve.');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await client
        .from('public_reviews')
        .insert({
          user_id: user.id,
          display_name: isAnonymous ? null : sanitizeText(displayName, 80) || user.email,
          is_anonymous: isAnonymous,
          rating,
          comment: safeComment,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) {
        console.error('PublicReviews insert:', error.message);
        toast.error(error.message);
        return;
      }

      await client.from('reward_requests').insert({
        user_id: user.id,
        review_id: data?.id ?? null,
        status: 'pending',
        admin_note: 'Solicitud creada desde reseña pública. Falta validar captura por chat si aplica.',
      });

      setSent(true);
      setComment('');
      toast.success('Tu comentario fue enviado y será revisado.');
    } catch (submitError) {
      console.error('Error enviando comentario:', submitError);
      toast.error(submitError instanceof Error ? submitError.message : 'No se pudo enviar el comentario.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="bg-ink-950 py-14">
      <div className="container-shell">
        <div className="mb-6 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">Confianza</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">Lo que la gente busca en ContactHub</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                {reviews.length
                  ? 'Comentarios reales aprobados por el admin.'
                  : 'Primeras experiencias de usuarios y casos de uso frecuentes. Los comentarios reales aparecerán aquí cuando sean aprobados.'}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-ink-950/70 p-4 text-center">
              <Stars value={reviews.length ? Math.round(average) : 5} />
              <p className="mt-2 font-display text-2xl font-bold text-white">{reviews.length ? `${average.toFixed(1)}/5` : 'Beta'}</p>
              <p className="text-xs text-gray-500">{reviews.length ? `${reviews.length} comentario(s)` : 'Sección en construcción'}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-gray-300 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'Primeras experiencias de usuarios',
              'Contactos organizados por metas',
              'Puedes explorar gratis antes de desbloquear',
              'Diseñado para encontrar oportunidades más rápido',
            ].map((item) => (
              <span key={item} className="rounded-full border border-line bg-white/5 px-3 py-2 text-center">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {visibleCards.slice(0, 4).map((card) => (
              <article key={card.id} className="card-hover rounded-2xl border border-line bg-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={card.rating} />
                  <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-[11px] font-bold text-gray-300">{card.label}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-300">"{card.text}"</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-200">{card.intent}</span>
                  <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">{card.source}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-display text-xl font-bold text-white">Deja tu comentario</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">Queda pendiente hasta revisión. No publicamos testimonios falsos.</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Puntuación</span>
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="focus-ring h-10 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} estrellas
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Comentario</span>
                <textarea
                  ref={textareaRef}
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, 800))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.ctrlKey) {
                      event.preventDefault();
                      void submitReview();
                    }
                  }}
                  rows={2}
                  placeholder="Cuéntanos qué buscabas o cómo podemos mejorar…"
                  className="chat-textarea focus-ring min-h-[76px] max-h-[140px] resize-none rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-sm leading-6 text-white shadow-inner shadow-black/20 placeholder:text-gray-500"
                />
                <span className="text-xs text-gray-500">Ctrl + Enter también envía. Enter normal hace salto de línea.</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
                Publicar como anónimo
              </label>
              {!isAnonymous ? (
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value.slice(0, 80))} placeholder="Nombre público opcional" className="focus-ring h-10 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white" />
              ) : null}
              <button type="button" disabled={isSaving} onClick={() => void submitReview()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-60">
                <Send className="h-4 w-4" />
                {isSaving ? 'Enviando...' : 'Enviar comentario'}
              </button>
              {sent ? (
                <div className="rounded-xl border border-brand-400/25 bg-brand-400/10 p-4 text-sm leading-6 text-gray-300">
                  <p className="font-bold text-white">Tu comentario fue enviado y será revisado.</p>
                  <p className="mt-2">¿Quieres 3 contactos extra? Escríbenos por el chat para revisar tu recompensa.</p>
                  <button type="button" onClick={() => openChat('Hola, dejé mi comentario en ContactHub y quiero activar mis 3 contactos extra.')} className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-xs font-bold text-ink-950">
                    <MessageCircle className="h-4 w-4" />
                    Abrir chat
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
