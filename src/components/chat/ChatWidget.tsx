import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/app';
import { useAuth } from '../../features/auth/AuthProvider';
import { sanitizeText } from '../../lib/sanitize';
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

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id,user_id,message,session_id,sender,read,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) return;
    if (!data?.length) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: user.id,
        sender: 'admin',
        read: false,
        message: APP_CONFIG.welcomeChatMessage,
      });
      await loadMessages();
      return;
    }
    setMessages(data);
    setUnread(data.filter((message) => message.sender === 'admin' && !message.read).length);
  }

  async function markAdminMessagesRead() {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    await supabase.from('chat_messages').update({ read: true }).eq('user_id', user.id).eq('sender', 'admin').eq('read', false);
    setUnread(0);
  }

  async function sendMessage() {
    if (!user?.id || !supabase || !text.trim()) return;
    const message = sanitizeText(text, 500);
    setText('');
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: user.id,
      sender: 'user',
      read: false,
      message,
    });
  }

  useEffect(() => {
    void loadMessages();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured) return undefined;
    const client = supabase;
    const channel = client
      .channel(`chat_messages_user_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${user.id}` },
        () => void loadMessages(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) void markAdminMessagesRead();
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages.length, isOpen]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('contacthub:open-chat', openChat);
    return () => window.removeEventListener('contacthub:open-chat', openChat);
  }, []);

  if (!user) return null;

  return (
    <div data-contacthub-chat className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="mb-4 flex h-[480px] w-[340px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-line bg-[#0F2027] shadow-2xl sm:max-w-none">
          <div className="flex items-center justify-between border-b border-line p-4">
            <div>
              <p className="font-bold text-white">💬 Soporte ContactHub</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-brand-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
                En línea
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-line p-2 text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${message.sender === 'user' ? 'bg-brand-500 text-ink-950' : 'bg-white/10 text-white'}`}>
                  <p>{message.message}</p>
                  <p className="mt-1 text-[10px] opacity-70">{new Date(message.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line p-3">
            <input
              value={text}
              onChange={(event) => setText(sanitizeText(event.target.value, 500))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void sendMessage();
              }}
              placeholder="Escribe tu mensaje"
              className="focus-ring h-10 min-w-0 flex-1 rounded-full border border-line bg-ink-950/70 px-4 text-sm text-white"
            />
            <button type="button" onClick={() => void sendMessage()} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-ink-950">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1DB47A] text-ink-950 shadow-glow">
        <MessageCircle className="h-6 w-6" />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span> : null}
      </button>
    </div>
  );
}
