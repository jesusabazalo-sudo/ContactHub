import { FileCheck2, FolderKanban, Gift, Home, KeyRound, ListChecks, MessageCircle, UploadCloud, UserRoundCog, UsersRound } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const mainLinks = [
  { label: 'Dashboard', to: '/admin', icon: Home },
  { label: 'Usuarios', to: '/admin/usuarios', icon: UsersRound },
  { label: 'Accesos', to: '/admin/accesos', icon: KeyRound },
  { label: 'Contactos', to: '/admin/contactos', icon: ListChecks },
  { label: 'Categorias', to: '/admin/categorias', icon: FolderKanban },
  { label: 'Importar', to: '/admin/importar', icon: UploadCloud },
];

const managementLinks = [
  { label: 'Soporte', to: '/admin/soporte', icon: MessageCircle },
  { label: 'Comprobantes', to: '/admin/comprobantes', icon: FileCheck2 },
  { label: 'Recompensas', to: '/admin/recompensas', icon: Gift },
  { label: 'CRM', to: '/admin/clientes', icon: UserRoundCog },
];

function AdminLink({
  link,
  unreadSupport = 0,
  pendingReceipts = 0,
}: {
  link: (typeof mainLinks)[number] | (typeof managementLinks)[number];
  unreadSupport?: number;
  pendingReceipts?: number;
}) {
  const badgeCount = link.to === '/admin/soporte' ? unreadSupport : link.to === '/admin/comprobantes' ? pendingReceipts : 0;

  return (
    <NavLink
      to={link.to}
      end={link.to === '/admin'}
      className={({ isActive }) =>
        `focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 ${
          isActive ? 'bg-gradient-to-r from-brand-400 to-accent-cyan text-ink-950 shadow-[0_0_22px_rgba(34,197,94,0.22)]' : 'text-gray-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <link.icon className="h-4 w-4" />
      {link.label}
      {badgeCount ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{badgeCount}</span> : null}
    </NavLink>
  );
}

export default function AdminShell({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [unreadSupport, setUnreadSupport] = useState(0);
  const [pendingReceipts, setPendingReceipts] = useState(0);

  useEffect(() => {
    async function loadUnread() {
      if (!supabase || !isSupabaseConfigured) return;
      const { count, error } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').eq('read', false);
      if (error) {
        console.error('AdminShell unread support:', error.message);
        return;
      }
      setUnreadSupport(count ?? 0);
    }
    void loadUnread();
    const interval = window.setInterval(loadUnread, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadPendingReceipts() {
      if (!supabase || !isSupabaseConfigured) return;
      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('has_attachment', true)
        .eq('comprobante_status', 'pendiente');
      if (error) {
        console.error('AdminShell pending receipts:', error.message);
        return;
      }
      setPendingReceipts(count ?? 0);
    }
    void loadPendingReceipts();
    const interval = window.setInterval(loadPendingReceipts, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-400">Panel Admin</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">ContactHub interno</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Gestion protegida por Supabase, user_roles y RLS. Desde aqui revisas usuarios, accesos, contactos, soporte y recompensas.
            </p>
          </div>
          {user?.email ? <span className="inline-flex w-fit rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-sm font-semibold text-brand-400">Admin: {user.email}</span> : null}
        </div>

        <div className="dopamine-card mb-4 overflow-x-auto rounded-2xl p-2">
          <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
            {mainLinks.map((link) => (
              <AdminLink key={link.to} link={link} />
            ))}
          </div>
        </div>

        <div className="mb-8 overflow-x-auto rounded-2xl border border-brand-400/15 bg-ink-950/60 p-2 shadow-[0_0_28px_rgba(34,197,94,0.06)]">
          <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
            <span className="px-3 text-xs font-bold uppercase tracking-wide text-gray-500">Gestion</span>
            {managementLinks.map((link) => (
              <AdminLink key={link.to} link={link} unreadSupport={unreadSupport} pendingReceipts={pendingReceipts} />
            ))}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
