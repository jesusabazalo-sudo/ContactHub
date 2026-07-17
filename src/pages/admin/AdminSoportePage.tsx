import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminNotice from '../../components/admin/AdminNotice';
import AdminShell from '../../components/admin/AdminShell';
import FriendlyErrorState from '../../components/system/FriendlyErrorState';
import LoadingState from '../../components/system/LoadingState';
import { useAuth } from '../../features/auth/AuthProvider';
import { formatDate } from '../../lib/format';
import { sanitizeText, sanitizeTextInput } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ChatMessage = {
  id: string;
  user_id: string | null;
  message: string;
  session_id: string;
  sender: 'user' | 'admin';
  read: boolean;
  created_at: string;
};

type Conversation = {
  userId: string;
  email: string | null;
  lastMessage: string;
  lastDate: string;
  unread: number;
};

function ensureClient() {
  if (!supabase || !isSupabaseConfigured) return null;
  return supabase;
}

export default function AdminSoportePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emailByUser, setEmailByUser] = useState<Map<string, string | null>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('user'));
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSupport() {
    setIsLoading(true);
    setError(null);
    try {
      const client = ensureClient();
      if (!client) {
        setMessages([]);
        setEmailByUser(new Map());
        setError('Falta conectar Supabase.');
        return;
      }
      const { data, error: messagesError } = await client
        .from('chat_messages')
        .select('id,user_id,message,session_id,sender,read,created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (messagesError) {
        console.error('AdminSoportePage messages:', messagesError.message);
        setMessages([]);
        setError(messagesError.message);
        return;
      }
      const userIds = [...new Set((data ?? []).map((message) => message.user_id).filter(Boolean))] as string[];
      const profilesResult = userIds.length ? await client.from('profiles').select('id,email').in('id', userIds) : { data: [], error: null };
      if (profilesResult.error) console.error('AdminSoportePage profiles:', profilesResult.error.message);
      setEmailByUser(new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.email])));
      setMessages(data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar soporte.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSupport();
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return undefined;
    const client = supabase;
    const channel = client
      .channel('admin_chat_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => void loadSupport())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  const conversations = useMemo<Conversation[]>(() => {
    const byUser = new Map<string, Conversation>();
    for (const message of messages) {
      if (!message.user_id) continue;
      const current = byUser.get(message.user_id);
      if (!current || new Date(message.created_at).getTime() > new Date(current.lastDate).getTime()) {
        byUser.set(message.user_id, {
          userId: message.user_id,
          email: emailByUser.get(message.user_id) ?? null,
          lastMessage: message.message.slice(0, 50),
          lastDate: message.created_at,
          unread: current?.unread ?? 0,
        });
      }
      if (message.sender === 'user' && !message.read) {
        byUser.set(message.user_id, { ...(byUser.get(message.user_id) as Conversation), unread: (byUser.get(message.user_id)?.unread ?? 0) + 1 });
      }
    }
    return [...byUser.values()].sort((a, b) => b.unread - a.unread || new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [emailByUser, messages]);

  const selectedMessages = messages
    .filter((message) => message.user_id === selectedUserId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  async function openConversation(userId: string) {
    setSelectedUserId(userId);
    const client = ensureClient();
    if (!client) return;
    await client.from('chat_messages').update({ read: true }).eq('user_id', userId).eq('sender', 'user').eq('read', false);
    await loadSupport();
  }

  async function sendReply() {
    if (!selectedUserId || !user?.id) return;
    if (!reply.trim()) {
      toast.error('Escribe una respuesta antes de enviar.');
      return;
    }
    const message = sanitizeText(reply, 500);
    const client = ensureClient();
    if (!client) return;
    setIsSending(true);
    try {
      const { error: insertError } = await client.from('chat_messages').insert({
        user_id: selectedUserId,
        session_id: selectedUserId,
        sender: 'admin',
        read: false,
        message,
      });
      if (insertError) {
        toast.error(insertError.message);
        return;
      }
      setReply('');
      toast.success('Respuesta enviada.');
      await loadSupport();
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) return <LoadingState title="Cargando soporte" message="Leyendo conversaciones internas." />;
  if (error) return <FriendlyErrorState message={error} onRetry={loadSupport} />;

  return (
    <AdminShell>
      <AdminNotice />
      <section className="grid gap-5 lg:grid-cols-[0.42fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-2xl font-bold text-content">Soporte</h2>
          <div className="mt-5 divide-y divide-line">
            {conversations.map((conversation) => (
              <button key={conversation.userId} type="button" onClick={() => void openConversation(conversation.userId)} className="block w-full py-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate font-semibold text-content">{conversation.email ?? conversation.userId}</p>
                  {conversation.unread ? <span className="flex-none rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-content">{conversation.unread} nuevos</span> : null}
                </div>
                <p className="mt-1 truncate text-sm text-content-secondary">{conversation.lastMessage}</p>
                <p className="mt-1 text-xs text-content-muted">{formatDate(conversation.lastDate)}</p>
              </button>
            ))}
            {!conversations.length ? <p className="py-8 text-sm text-content-secondary">No hay conversaciones todavía.</p> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          {selectedUserId ? (
            <>
              <h3 className="font-display text-xl font-bold text-content">{emailByUser.get(selectedUserId) ?? selectedUserId}</h3>
              <div className="mt-5 h-[460px] space-y-3 overflow-y-auto rounded-xl border border-border bg-canvas/50 p-4">
                {selectedMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender === 'admin' ? 'bg-brand-400 text-ink-950' : 'bg-muted text-content'}`}>
                      <p>{message.message}</p>
                      <p className="mt-1 text-[10px] opacity-70">{formatDate(message.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={reply}
                  onChange={(event) => setReply(sanitizeTextInput(event.target.value, 500))}
                  disabled={isSending}
                  className="focus-ring h-11 flex-1 rounded-full border border-border bg-canvas/70 px-4 text-content disabled:opacity-60"
                  placeholder="Respuesta"
                />
                <button
                  type="button"
                  onClick={() => void sendReply()}
                  disabled={isSending}
                  className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-brand-400 px-5 text-sm font-bold text-ink-950 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-[360px] place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto h-10 w-10 text-brand-text" />
                <p className="mt-3 font-semibold text-content">Selecciona una conversación.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
