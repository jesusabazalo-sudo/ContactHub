import { MessageCircle, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

function reviewsClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase as unknown as { from: (table: string) => any };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-300">
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

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  async function submitReview() {
    const client = reviewsClient();
    if (!client || !user?.id) {
      toast.info('Inicia sesión para dejar tu comentario.');
      return;
    }

    if (!comment.trim()) {
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
          comment: sanitizeText(comment, 800),
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
    <section className="bg-ink-950 py-12">
      <div className="container-shell">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-line bg-panel p-6">
            <p className="text-sm font-semibold uppercase text-brand-400">Comentarios</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">Lo que dicen los que ya entraron</h2>
            <div className="mt-4 flex items-center gap-3">
              <Stars value={Math.round(average)} />
              <span className="text-sm text-gray-400">{reviews.length ? `${average.toFixed(1)} promedio · ${reviews.length} comentario(s)` : 'Aún no hay comentarios aprobados.'}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-line bg-white/5 p-4">
                  <Stars value={review.rating} />
                  <p className="mt-2 text-sm leading-6 text-gray-300">{review.comment}</p>
                  <p className="mt-2 text-xs font-semibold text-gray-500">{review.is_anonymous ? 'Anónimo' : review.display_name || 'Usuario ContactHub'}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="font-display text-2xl font-bold text-white">Dejar comentario</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">Tu comentario queda pendiente hasta que el admin lo apruebe. No inventamos testimonios.</p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Puntuación</span>
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} estrellas
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-300">Comentario</span>
                <textarea value={comment} onChange={(event) => setComment(sanitizeText(event.target.value, 800))} rows={4} className="focus-ring rounded-2xl border border-line bg-ink-950/70 px-4 py-3 text-white" />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
                Publicar como anónimo
              </label>
              {!isAnonymous ? (
                <input value={displayName} onChange={(event) => setDisplayName(sanitizeText(event.target.value, 80))} placeholder="Nombre público opcional" className="focus-ring h-11 rounded-full border border-line bg-ink-950/70 px-4 text-white" />
              ) : null}
              <button type="button" disabled={isSaving} onClick={() => void submitReview()} className="focus-ring rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-60">
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
