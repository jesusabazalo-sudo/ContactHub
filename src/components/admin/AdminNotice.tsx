import { isSupabaseConfigured } from '../../lib/supabaseClient';
import SupabaseMissingAlert from '../system/SupabaseMissingAlert';

export default function AdminNotice() {
  if (isSupabaseConfigured) return null;

  return <SupabaseMissingAlert className="mb-6" />;
}
