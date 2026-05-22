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

const welcomeMessage =
  'Hola 👋 Soy el asistente de ContactHub. Te puedo ayudar con precios, carpetas, pagos, acceso y dudas. ¿Qué estás buscando?';

const quickActions = [
  { label: 'Ver precios', message: 'Hola, quiero ver precios' },
  { label: 'Quiero una carpeta', message: 'Hola, quiero una carpeta de ContactHub' },
  { label: 'Cómo pago', message: 'Hola, quiero saber cómo pago por Yape o Plin' },
  { label: 'No entiendo', message: 'No entiendo bien cómo funciona ContactHub' },
];

function localMessage(message: string, sender: 'user' | 'admin'): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: null,
    session_id: 'local',
    sender,
    read: true,
    message,
    created_at: new Date().toISOString(),
  };
}

function autoReplyFor(message: string) {
  const text = message.toLowerCase();
  if (/(precio|precios|plan|starter|fast|power|elite|s\/|cuesta|costo)/i.test(text)) {
    return 'Tenemos opciones desde S/20 por carpeta hasta S/360 acceso total. ¿Quieres que te recomiende una opción según lo que buscas?';
  }
  if (/(pago|pagar|yape|plin|transferencia)/i.test(text)) {
    return 'Puedes pagar por Yape o Plin. Primero dime qué plan quieres y te guiamos con el acceso.';
  }
  if (/(carpeta|carpetas|contacto|contactos|oportunidad|proveedor)/i.test(text)) {
    return 'Cada carpeta tiene información privada y ordenada para que encuentres contactos u oportunidades específicas.';
  }
  if (/(acceso|activar|activación|habilitar|entrar|desbloquear)/i.test(text)) {
    return 'La activación es manual verificada. Después del pago se habilita el acceso correspondiente.';
  }
  if (/(persona|jesús|jesus|humano|whatsapp|asesor)/i.test(text)) {
    return 'Claro. Si deseas hablar directamente con Jesús, puedes usar WhatsApp como último paso.';
  }
  return 'No entendí bien 😅 Puedes escribirlo de otra forma o elegir una opción rápida abajo.';
}

function getWhatsAppUrl() {
  const number = ((import.meta.env.NEXT_PUBLIC_WHATSAPP_NUMBER as string | undefined) ?? APP_CONFIG.whatsappNumber).replace(/\D/g, '');
  const message = 'Hola Jesús, vengo desde ContactHub. Tengo una consulta sobre las carpetas y quiero más información.';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([localMessage(welcomeMessage, 'admin')]);
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
        message: welcomeMessage,
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

  async function appendAutoReply(message: string) {
    const reply = autoReplyFor(message);
    setMessages((current) => [...current, localMessage(reply, 'admin')]);
    if (user?.id && supabase && isSupabaseConfigured) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: user.id,
        sender: 'admin',
        read: false,
        message: reply,
      });
    }
  }

  async function sendMessage(messageOverride?: string) {
    const message = sanitizeText(messageOverride ?? text, 500);
    if (!message) return;
    setText('');
    setIsOpen(true);
    setMessages((current) => [...current, localMessage(message, 'user')]);

    if (user?.id && supabase && isSupabaseConfigured) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: user.id,
        sender: 'user',
        read: false,
        message,
      });
    }

    window.setTimeout(() => {
      void appendAutoReply(message);
    }, 350);
  }

  useEffect(() => {
    void loadMessages();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured) return undefined;
    const client = supabase;
    const channel = client
      .channel(`chat_messages_user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${user.id}` }, () => void loadMessages())
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
    const openChat = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; prefill?: string }>).detail;
      setIsOpen(true);
      const message = detail?.message ?? detail?.prefill;
      if (message) void sendMessage(message);
    };
    window.addEventListener('contacthub:open-chat', openChat);
    return () => window.removeEventListener('contacthub:open-chat', openChat);
  }, [text, user?.id]);

  return (
    <div data-contacthub-chat className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="mb-4 flex h-[520px] w-[340px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-line bg-[#0F2027] shadow-2xl sm:max-w-none">
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
          <div className="border-t border-line p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button key={action.label} type="button" onClick={() => void sendMessage(action.message)} className="rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-brand-400/50">
                  {action.label}
                </button>
              ))}
              <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer" className="rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-semibold text-brand-300">
                Hablar con Jesús por WhatsApp
              </a>
            </div>
            <div className="flex gap-2">
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
        </div>
      ) : null}
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1DB47A] text-ink-950 shadow-glow">
        <MessageCircle className="h-6 w-6" />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span> : null}
      </button>
    </div>
  );
}
