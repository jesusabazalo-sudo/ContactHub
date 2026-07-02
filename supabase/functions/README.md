# Pago automático con Culqi — guía de activación (sandbox → producción)

Estado: **diseñado, en modo prueba e INERTE.** Nada de esto afecta producción
hasta que crees la cuenta de Culqi, configures las llaves y despliegues. Mientras
`VITE_CULQI_PUBLIC_KEY` esté vacío, la app sigue 100% con el flujo Yape manual.

## Piezas

- `supabase/migrations/031_purchases_payment_provider.sql` — columnas de cobro en
  `purchases` (provider, provider_charge_id, amount, currency, paid_at) +
  idempotencia. **Aún NO aplicada.**
- `supabase/functions/culqi-charge/` — cobra el token y activa el acceso (núcleo).
- `supabase/functions/culqi-webhook/` — reconciliación opcional (red de seguridad).
- `src/lib/culqi.ts` + `src/components/pricing/CulqiPayButton.tsx` — checkout en el front.

## Cómo funciona el flujo

1. Cliente elige plan → `openCulqiCheckout` tokeniza la tarjeta/Yape en el navegador.
2. El front llama a `culqi-charge` con el token (no con el precio).
3. La función **lee el precio de `plans`** (servidor), cobra en Culqi con la llave
   secreta, y si el cobro es exitoso escribe `purchases` (active) + concede
   `user_category_access`. Idempotente por `provider_charge_id`.
4. El cliente ve los teléfonos al instante (lo cubre `has_category_access`).

> Seguridad: el precio nunca viene del cliente; el front solo manda el token y el
> plan. La llave secreta vive solo en el servidor (Supabase secret).

## Pasos para activar (cuando tengas la cuenta Culqi)

1. **Sandbox primero.** En el panel de Culqi (modo prueba) copia:
   - llave pública `pk_test_...`
   - llave secreta `sk_test_...`
2. **Aplica la migración** 031 en Supabase (SQL Editor o `supabase db push`).
3. **Configura el secret del servidor** (no en el front):
   ```bash
   supabase secrets set CULQI_SECRET_KEY=sk_test_xxx
   ```
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya las
   inyecta Supabase a las functions.)
4. **Despliega las functions:**
   ```bash
   supabase functions deploy culqi-charge
   supabase functions deploy culqi-webhook   # opcional
   ```
5. **Front:** pon `VITE_CULQI_PUBLIC_KEY=pk_test_...` en Vercel (env del proyecto)
   y redepliega. Aparecerá el botón "Pagar con tarjeta o Yape".
6. **Prueba en sandbox** con las tarjetas de prueba de Culqi (las publica en su
   doc). Verifica que se cree la fila en `purchases` (status active, provider
   culqi) y el acceso en `user_category_access`.
7. **Webhook (opcional):** en el panel de Culqi registra la URL
   `https://<PROYECTO>.functions.supabase.co/culqi-webhook` para eventos de cargo.
8. **Producción:** repite con las llaves `pk_live_...` / `sk_live_...` cuando todo
   funcione en sandbox.

## Alcance actual (honesto)

- ✅ **Acceso total**: activación 100% automática (cobro directo).
- ✅ **Planes multi-carpeta (Starter/Power/Fast Track):** el botón abre el
  selector "elige tus N carpetas" (`FolderPicker`), luego cobra y concede esas
  carpetas. El límite se valida también en el servidor.
- ✅ **1 carpeta**: automático pasando `categoryIds` al botón (p. ej. desde el
  detalle de una carpeta).
- El **Yape manual sin comisión** se mantiene como respaldo en todos los planes.
- Todo sigue **inerte** hasta definir `VITE_CULQI_PUBLIC_KEY` + desplegar
  functions + aplicar la migración 031.
