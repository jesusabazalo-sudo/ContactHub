import { Activity, Clock3, FolderKanban, KeyRound, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { formatDate } from '../../lib/format';
import { getAdminDashboardData, type AdminDashboardData } from '../../services/adminService';

const quickLinks = [
  { label: 'Clientes / CRM', to: '/admin/clientes', description: 'Ficha completa de clientes, notas, recompensas y soporte.' },
  { label: 'Activar cliente', to: '/admin/accesos', description: 'Busca por email y desbloquea carpetas.' },
  { label: 'Ver usuarios', to: '/admin/usuarios', description: 'Revisa registros, roles y accesos activos.' },
  { label: 'Solicitudes', to: '/admin/accesos', description: 'Atiende compras pendientes.' },
  { label: 'Ver catálogo', to: '/catalogo', description: 'Comprueba la experiencia pública.' },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getAdminDashboardData());
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard admin.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (isLoading) {
    return <LoadingState title="Cargando panel admin" message="Estamos trayendo métricas y actividad desde Supabase." />;
  }

  if (error) {
    return <FriendlyErrorState message={error} onRetry={loadDashboard} />;
  }

  const stats = [
    { label: 'Usuarios', value: data?.totalUsers ?? 0, icon: UsersRound },
    { label: 'Categorías activas', value: data?.activeCategories ?? 0, icon: FolderKanban },
    { label: 'Accesos activos', value: data?.activeAccesses ?? 0, icon: KeyRound },
    { label: 'Solicitudes pendientes', value: data?.pendingPurchases ?? 0, icon: Clock3 },
  ];

  return (
    <AdminShell>
      <AdminNotice />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-line bg-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-400">{stat.label}</p>
                <p className="mt-2 font-display text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display text-2xl font-bold text-white">Accesos rápidos</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link key={link.label} to={link.to} className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-brand-400/35 hover:bg-brand-400/10">
                <p className="font-semibold text-white">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-gray-400">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-400" />
            <h2 className="font-display text-2xl font-bold text-white">Actividad reciente</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {data?.recentActivity.length ? (
              data.recentActivity.map((activity) => (
                <article key={activity.id} className="rounded-lg border border-line bg-ink-950/50 p-4">
                  <p className="font-semibold text-white">{activity.action}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                  <p className="mt-2 text-sm text-gray-400">
                    {activity.targetType ?? 'evento'} {activity.targetId ? `· ${activity.targetId.slice(0, 8)}` : ''}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-ink-950/50 p-4 text-sm leading-6 text-gray-400">
                Todavía no hay actividad registrada. Cuando actives accesos o canceles solicitudes, aparecerán aquí.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
