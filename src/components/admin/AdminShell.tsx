import { FolderKanban, Gift, KeyRound, LayoutDashboard, ListChecks, MessageCircle, UploadCloud, UserRoundCog, UsersRound } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const adminLinks = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Clientes / CRM', to: '/admin/clientes', icon: UserRoundCog },
  { label: 'Usuarios', to: '/admin/usuarios', icon: UsersRound },
  { label: 'Accesos', to: '/admin/accesos', icon: KeyRound },
  { label: 'Contactos', to: '/admin/contactos', icon: ListChecks },
  { label: 'Categorías', to: '/admin/categorias', icon: FolderKanban },
  { label: 'Importar', to: '/admin/importar', icon: UploadCloud },
  { label: 'Recompensas', to: '/admin/recompensas', icon: Gift },
  { label: 'Soporte', to: '/admin/soporte', icon: MessageCircle, badge: true },
];

export default function AdminShell({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [unreadSupport, setUnreadSupport] = useState(0);

  useEffect(() => {
    async function loadUnread() {
      if (!supabase || !isSupabaseConfigured) return;
      const { count } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').eq('read', false);
      setUnreadSupport(count ?? 0);
    }
    void loadUnread();
  }, []);

  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-400">Panel Admin</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">ContactHub interno</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Gestión protegida por Supabase, `user_roles` y RLS. Nada de admins hardcodeados en frontend.
            </p>
          </div>
          {user?.email ? <span className="inline-flex w-fit rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-sm font-semibold text-brand-400">Admin: {user.email}</span> : null}
        </div>

        <div className="mb-8 overflow-x-auto rounded-2xl border border-line bg-panel p-2">
          <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  `focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive ? 'bg-brand-400 text-ink-950' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {'badge' in link && link.badge && unreadSupport ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadSupport}</span> : null}
              </NavLink>
            ))}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
