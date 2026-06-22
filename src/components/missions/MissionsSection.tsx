import { CheckCircle2, Gift, MessageCircle, Share2, Star, UploadCloud, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import { sanitizeText } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type MissionStatus = 'available' | 'pending' | 'approved' | 'rejected';

type RewardRequestRow = {
  id: string;
  status: MissionStatus;
  admin_note: string | null;
  created_at: string;
};

type Mission = {
  id: string;
  title: string;
  description: string;
  reward: string;
  icon: typeof Share2;
  evidenceMessage: string;
};

const missions: Mission[] = [
  {
    id: 'share-story',
    title: 'Compartir ContactHub',
    description: 'Publica ContactHub en una historia o estado y envía captura para revisión.',
    reward: '+1 contacto extra',
    icon: Share2,
    evidenceMessage: 'Hola, compartí ContactHub en una historia o estado y quiero enviar evidencia para ganar un contacto extra.',
  },
  {
    id: 'invite-friend',
    title: 'Invitar a un amigo',
    description: 'Recomienda ContactHub a alguien que pueda necesitar contactos u oportunidades.',
    reward: '+1 contacto gratis',
    icon: UserPlus,
    evidenceMessage: 'Hola, invité a un amigo a registrarse en ContactHub y quiero enviar evidencia.',
  },
  {
    id: 'testimonial',
    title: 'Dejar testimonio',
    description: 'Cuéntanos cómo te ayudó la plataforma. Los testimonios se revisan antes de publicarse.',
    reward: '+3 contactos en revisión',
    icon: Star,
    evidenceMessage: 'Hola, dejé mi testimonio en ContactHub y quiero activar mi recompensa.',
  },
  {
    id: 'send-proof',
    title: 'Enviar evidencia',
    description: 'Si ya hiciste una acción de apoyo, manda la captura para que el admin la revise.',
    reward: 'Descuento o contacto extra',
    icon: UploadCloud,
    evidenceMessage: 'Hola, vengo desde ContactHub. Quiero enviar evidencia para ganar un contacto extra.',
  },
];

function rewardsClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase as unknown as { from: (table: string) => any };
}

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

function statusLabel(status?: MissionStatus) {
  if (status === 'pending') return 'En revisión';
  if (status === 'approved') return 'Aprobada';
  if (status === 'rejected') return 'Rechazada';
  return 'Disponible';
}

function statusClass(status?: MissionStatus) {
  if (status === 'pending') return 'border-amber-300/25 bg-amber-300/10 text-amber-100';
  if (status === 'approved') return 'border-brand-400/25 bg-brand-400/10 text-brand-text';
  if (status === 'rejected') return 'border-red-400/25 bg-red-400/10 text-red-100';
  return 'border-border bg-muted text-content-secondary';
}

export default function MissionsSection({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RewardRequestRow[]>([]);
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);

  async function loadRequests() {
    const client = rewardsClient();
    if (!client || !user?.id) {
      setRequests([]);
      return;
    }

    const { data, error } = await client
      .from('reward_requests')
      .select('id,status,admin_note,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('No se pudieron cargar misiones:', error.message);
      setRequests([]);
      return;
    }

    setRequests(data ?? []);
  }

  useEffect(() => {
    void loadRequests();
  }, [user?.id]);

  const statusByMission = useMemo(() => {
    const map = new Map<string, MissionStatus>();
    missions.forEach((mission) => {
      const match = requests.find((request) => request.admin_note?.includes(`Mision:${mission.id}`));
      if (match) map.set(mission.id, match.status);
    });
    return map;
  }, [requests]);

  async function requestMissionReview(mission: Mission) {
    if (!user?.id) {
      toast.info('Crea tu cuenta gratis para enviar misiones.');
      navigate('/auth?redirect=/mis-contactos');
      return;
    }

    setSavingMissionId(mission.id);
    const message = mission.evidenceMessage;
    openSupportChat(message);

    try {
      const client = rewardsClient();
      if (!client) {
        toast.info('Te abrimos el chat para que envíes tu evidencia.');
        return;
      }

      const cleanNote = sanitizeText(`Mision:${mission.id} | ${mission.title}. Evidencia pendiente por chat.`, 300);
      const { error } = await client.from('reward_requests').insert({
        user_id: user.id,
        status: 'pending',
        admin_note: cleanNote,
      });

      if (error) {
        console.warn('No se pudo crear solicitud de misión:', error.message);
        toast.info('Te abrimos el chat. Si la solicitud no aparece en admin, revísala manualmente.');
        return;
      }

      toast.success('Misión enviada a revisión.');
      await loadRequests();
    } finally {
      setSavingMissionId(null);
    }
  }

  return (
    <section className={compact ? 'mt-8' : 'bg-canvas py-14'}>
      <div className={compact ? '' : 'container-shell'}>
        <div className="professional-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-text">Misiones</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-content">Gana contactos extra apoyando ContactHub</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-content-secondary">
                Si ahora no puedes pagar, igual puedes empezar. Completa una acción sencilla, envía evidencia por chat y el admin revisará tu recompensa.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-xs font-bold text-brand-text">
              <Gift className="h-4 w-4" />
              Revisión manual
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {missions.map((mission) => {
              const status = statusByMission.get(mission.id);
              const Icon = mission.icon;
              const isPending = savingMissionId === mission.id;

              return (
                <article key={mission.id} className="rounded-lg border border-border bg-canvas/55 p-5 transition hover:border-brand-400/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-400/10 text-brand-text">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusClass(status)}`}>{statusLabel(status)}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-content">{mission.title}</h3>
                  <p className="mt-3 min-h-16 text-sm leading-6 text-content-secondary">{mission.description}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-text">
                    <CheckCircle2 className="h-4 w-4" />
                    {mission.reward}
                  </p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void requestMissionReview(mission)}
                    className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white disabled:opacity-60"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {status === 'pending' ? 'Enviar más evidencia' : isPending ? 'Abriendo chat...' : 'Enviar evidencia'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
