import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          role?: 'user' | 'admin';
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          short_description: string;
          icon: string;
          contacts_count: number;
          sort_order: number | null;
          display_order: number | null;
          tags: string[];
          is_active: boolean;
          is_featured: boolean;
          is_new: boolean;
          is_top: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          short_description?: string;
          icon?: string;
          contacts_count?: number;
          sort_order?: number | null;
          display_order?: number | null;
          tags?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          is_top?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          short_description?: string;
          icon?: string;
          contacts_count?: number;
          sort_order?: number | null;
          display_order?: number | null;
          tags?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          is_top?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          category_id: string;
          subcategory_id: string | null;
          name: string;
          description: string;
          phone: string | null;
          raw_phone: string | null;
          phone_status: 'valid' | 'needs_review' | 'missing' | 'invalid' | 'placeholder_bug';
          phone_masked: string;
          country_flag: string | null;
          country_code: string | null;
          tags: string[];
          source: string | null;
          visibility: 'public' | 'restricted' | 'admin_only';
          is_public: boolean;
          import_batch: string | null;
          import_note: string | null;
          status: 'active' | 'inactive' | 'review' | 'rejected';
          risk_level: 'safe' | 'review' | 'prohibited';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          subcategory_id?: string | null;
          name: string;
          description?: string;
          phone?: string | null;
          raw_phone?: string | null;
          phone_status?: 'valid' | 'needs_review' | 'missing' | 'invalid' | 'placeholder_bug';
          phone_masked?: string | null;
          country_flag?: string | null;
          country_code?: string | null;
          tags?: string[];
          source?: string | null;
          visibility?: 'public' | 'restricted' | 'admin_only';
          is_public?: boolean;
          import_batch?: string | null;
          import_note?: string | null;
          status?: 'active' | 'inactive' | 'review' | 'rejected';
          risk_level?: 'safe' | 'review' | 'prohibited';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          subcategory_id?: string | null;
          name?: string;
          description?: string;
          phone?: string | null;
          raw_phone?: string | null;
          phone_status?: 'valid' | 'needs_review' | 'missing' | 'invalid' | 'placeholder_bug';
          phone_masked?: string | null;
          country_flag?: string | null;
          country_code?: string | null;
          tags?: string[];
          source?: string | null;
          visibility?: 'public' | 'restricted' | 'admin_only';
          is_public?: boolean;
          import_batch?: string | null;
          import_note?: string | null;
          status?: 'active' | 'inactive' | 'review' | 'rejected';
          risk_level?: 'safe' | 'review' | 'prohibited';
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          price: number;
          folder_limit: number | null;
          is_total_access: boolean;
          description: string;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          folder_limit?: number | null;
          is_total_access?: boolean;
          description?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          price?: number;
          folder_limit?: number | null;
          is_total_access?: boolean;
          description?: string;
          is_featured?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          category_id: string | null;
          status: 'pending' | 'active' | 'revoked' | 'expired';
          granted_by: string | null;
          granted_at: string | null;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          category_id?: string | null;
          status?: 'pending' | 'active' | 'revoked' | 'expired';
          granted_by?: string | null;
          granted_at?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string | null;
          category_id?: string | null;
          status?: 'pending' | 'active' | 'revoked' | 'expired';
          granted_by?: string | null;
          granted_at?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_category_access: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          granted_by: string | null;
          status: 'active' | 'revoked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          granted_by?: string | null;
          status?: 'active' | 'revoked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          granted_by?: string | null;
          status?: 'active' | 'revoked';
          updated_at?: string;
        };
        Relationships: [];
      };
      trial_claims: {
        Row: {
          id: string;
          user_id: string;
          contact_ids: string[];
          claimed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_ids?: string[];
          claimed_at?: string;
        };
        Update: {
          contact_ids?: string[];
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string | null;
          message: string;
          session_id: string;
          sender: 'user' | 'admin';
          read: boolean;
          created_at: string;
          expires_at?: string | null;
          has_attachment?: boolean | null;
          attachment_url?: string | null;
          attachment_type?: string | null;
          comprobante_status?: 'pendiente' | 'verificado' | 'rechazado' | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          message: string;
          session_id: string;
          sender?: 'user' | 'admin';
          read?: boolean;
          created_at?: string;
          expires_at?: string | null;
          has_attachment?: boolean | null;
          attachment_url?: string | null;
          attachment_type?: string | null;
          comprobante_status?: 'pendiente' | 'verificado' | 'rechazado' | null;
        };
        Update: {
          message?: string;
          session_id?: string;
          sender?: 'user' | 'admin';
          read?: boolean;
          expires_at?: string | null;
          has_attachment?: boolean | null;
          attachment_url?: string | null;
          attachment_type?: string | null;
          comprobante_status?: 'pendiente' | 'verificado' | 'rechazado' | null;
        };
        Relationships: [];
      };
      customer_status: {
        Row: {
          id: string;
          user_id: string;
          status: 'nuevo' | 'pendiente' | 'activo' | 'vip' | 'bloqueado';
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'nuevo' | 'pendiente' | 'activo' | 'vip' | 'bloqueado';
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'nuevo' | 'pendiente' | 'activo' | 'vip' | 'bloqueado';
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_rewards: {
        Row: {
          id: string;
          user_id: string;
          reward_type: string;
          quantity: number;
          reason: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_type: string;
          quantity?: number;
          reason?: string;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          reward_type?: string;
          quantity?: number;
          reason?: string;
          granted_by?: string | null;
        };
        Relationships: [];
      };
      customer_notes: {
        Row: {
          id: string;
          user_id: string;
          note: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string;
        };
        Relationships: [];
      };
      customer_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          comment: string;
          rating: number;
          status: 'pending' | 'approved' | 'hidden';
          reward_granted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          comment: string;
          rating: number;
          status?: 'pending' | 'approved' | 'hidden';
          reward_granted?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          name?: string;
          comment?: string;
          rating?: number;
          status?: 'pending' | 'approved' | 'hidden';
          reward_granted?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Relationships: [];
      };
      public_reviews: {
        Row: {
          id: string;
          user_id: string | null;
          display_name: string | null;
          is_anonymous: boolean;
          rating: number;
          comment: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          display_name?: string | null;
          is_anonymous?: boolean;
          rating: number;
          comment: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          is_anonymous?: boolean;
          rating?: number;
          comment?: string;
          status?: 'pending' | 'approved' | 'rejected';
        };
        Relationships: [];
      };
      user_tokens: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          total_earned: number;
          total_spent: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          total_earned?: number;
          total_spent?: number;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          total_earned?: number;
          total_spent?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: string;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      contact_token_unlocks: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          tokens_spent: number;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          tokens_spent?: number;
          unlocked_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      contact_views: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          action: 'view' | 'copy' | 'whatsapp';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          action: 'view' | 'copy' | 'whatsapp';
          created_at?: string;
        };
        Update: {
          action?: 'view' | 'copy' | 'whatsapp';
        };
        Relationships: [];
      };
      reward_requests: {
        Row: {
          id: string;
          user_id: string;
          review_id: string | null;
          screenshot_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          bonus_contact_ids: string[];
          admin_note: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          review_id?: string | null;
          screenshot_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          bonus_contact_ids?: string[];
          admin_note?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          review_id?: string | null;
          screenshot_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          bonus_contact_ids?: string[];
          admin_note?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      contact_unlocked_secure: {
        Row: {
          id: string;
          category_id: string;
          subcategory_id: string | null;
          name: string;
          description: string;
          phone: string;
          phone_masked: string;
          country_flag: string | null;
          country_code: string | null;
          tags: string[];
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      contact_public_preview: {
        Row: {
          id: string;
          category_id: string;
          subcategory_id: string | null;
          name: string;
          description: string;
          phone_masked: string;
          country_flag: string | null;
          country_code: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      admin_contacts_secure: {
        Row: {
          id: string;
          category_id: string;
          subcategory_id: string | null;
          name: string;
          description: string;
          phone: string;
          phone_masked: string;
          country_flag: string | null;
          country_code: string | null;
          tags: string[];
          source: string | null;
          status: 'active' | 'inactive' | 'review' | 'rejected';
          risk_level: 'safe' | 'review' | 'prohibited';
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      contact_trial_secure: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          phone: string;
          phone_masked: string;
          country_flag: string | null;
          country_code: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      has_category_access: {
        Args: {
          user_id: string;
          category_id: string;
        };
        Returns: boolean;
      };
      spend_token_to_unlock: {
        Args: {
          p_contact_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          balance?: number;
          contact_name?: string;
          new_balance?: number;
        };
      };
      award_mission_tokens: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: string;
          p_description: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          tokens_awarded?: number;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const supabaseAnonKey = supabaseKey;
const forbiddenSupabaseRole = ['service', 'role'].join('_');

// No lanzamos excepción en la carga del módulo: eso provocaría una pantalla en
// blanco imposible de capturar por el ErrorBoundary. En su lugar degradamos a
// `supabase = null` y la UI muestra <SupabaseMissingAlert />. Avisamos en consola.
if ((!supabaseUrl || !supabaseKey) && import.meta.env.DEV) {
  console.warn('[ContactHub] Faltan variables de entorno de Supabase. Crea un .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

if (supabaseKey.includes(forbiddenSupabaseRole)) {
  // Salvaguarda de seguridad crítica: jamás crear el cliente con la service_role
  // key en el frontend. Degradamos a null en vez de exponerla.
  console.error(`[ContactHub] Se detectó una clave de tipo "${forbiddenSupabaseRole}" en el frontend. El cliente Supabase NO se inicializará.`);
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes('tu-proyecto') ||
    normalized.includes('tu_anon_key') ||
    normalized.includes('tu-anon-key') ||
    normalized.includes('tu_anon_key_publica') ||
    normalized.includes('tu-anon-key-publica') ||
    normalized.includes('tu-proyecto.supabase.co')
  );
}

function isLikelySupabaseUrl(value: string) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function getJwtRole(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='));
    const parsed = JSON.parse(json) as { role?: string };
    return parsed.role ?? null;
  } catch {
    return null;
  }
}

function isAnonKey(value: string) {
  return getJwtRole(value) !== forbiddenSupabaseRole;
}

export const isSupabaseConfigured =
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey) &&
  isLikelySupabaseUrl(supabaseUrl) &&
  isAnonKey(supabaseAnonKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const friendlyError = (err: unknown): string => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Failed to fetch')) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  if (msg.includes('JWT expired')) return 'Tu sesión expiró. Por favor inicia sesión de nuevo.';
  if (msg.includes('permission denied')) return 'No tienes acceso a esta sección.';
  if (msg.includes('timeout')) return 'La página tardó demasiado. Intenta de nuevo.';
  return 'Algo salió mal. Recarga la página si el problema continúa.';
};

export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown; count?: number | null }>,
  retries = 2,
): Promise<{ data: T | null; error: string | null; count?: number | null }> {
  for (let i = 0; i <= retries; i += 1) {
    const { data, error, count } = await queryFn();
    if (!error) return { data, error: null, count };
    if (i < retries) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1000 * (i + 1));
      });
    } else {
      return { data: null, error: friendlyError(error) };
    }
  }

  return { data: null, error: 'Error desconocido' };
}

export const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]);
};
