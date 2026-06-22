import { AlertTriangle } from 'lucide-react';

type SupabaseMissingAlertProps = {
  className?: string;
};

export default function SupabaseMissingAlert({ className = '' }: SupabaseMissingAlertProps) {
  return (
    <div className={`rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-100 ${className}`}>
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <div>
          <p className="font-semibold">Falta conectar Supabase.</p>
          <p className="mt-2 text-sm leading-6">
            Crea un archivo `.env.local` en la raíz del proyecto con las variables necesarias.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-amber-300/20 bg-canvas/70 p-3 text-xs leading-5 text-amber-50">
{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_PUBLICA
VITE_OWNER_ADMIN_EMAIL=tu_correo_admin@ejemplo.com`}
          </pre>
          <p className="mt-3 text-xs leading-5 text-amber-100/80">
            Usa solo la anon/public key. Nunca pegues una clave privada en el frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
