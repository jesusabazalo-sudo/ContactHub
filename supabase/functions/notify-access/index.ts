// Envía un email de notificación cuando el admin activa un acceso.
// Requiere RESEND_API_KEY configurado como secret en Supabase.
// El email es un "nice to have": si falla, no debe romper el flujo de
// activación de acceso (por eso el caller lo invoca dentro de un try/catch).

import { corsHeaders } from '../_shared/cors.ts';

const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!resendApiKey) throw new Error('RESEND_API_KEY no está configurado.');

    const { user_email, user_name, category_name } = await req.json();
    if (!user_email) {
      return new Response(JSON.stringify({ error: 'Falta user_email.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'ContactHub <noreply@resend.dev>',
        to: user_email,
        subject: '✅ Tu acceso a ContactHub está listo',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h1 style="color:#10C88C;font-size:24px;margin-bottom:8px">¡Tu acceso está activo!</h1>
            <p style="color:#333;font-size:16px">Hola ${user_name ?? 'por ahí'},</p>
            <p style="color:#555;font-size:15px">
              Tu acceso a la carpeta <strong>${category_name ?? 'tu carpeta'}</strong> en ContactHub
              ya está activado. Puedes ver todos los contactos completos ahora mismo.
            </p>
            <a href="https://contact-hub-knmq.vercel.app/mis-contactos"
               style="display:inline-block;margin-top:20px;padding:12px 24px;
                      background:#10C88C;color:#000;font-weight:bold;
                      border-radius:8px;text-decoration:none">
              Ver mis contactos →
            </a>
            <p style="color:#999;font-size:12px;margin-top:32px">
              ContactHub · Contactos con propósito · Hecho en Perú 🇵🇪
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-access error:', error);
    const message = error instanceof Error ? error.message : 'No se pudo enviar el email.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
