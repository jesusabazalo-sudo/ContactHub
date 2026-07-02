# Prueba E2E — Culqi sandbox (registro → pago → activación automática → ver teléfono)

Sigue esto **en orden** cuando tengas las llaves de prueba de Culqi. No toca
producción real hasta el paso final (Go-live). Proyecto Supabase: `zecysscsehgejdklvcva`.

---

## 0. Requisitos (una sola vez)

- [ ] Cuenta Culqi en **modo prueba**. Copia del panel:
  - Llave pública: `pk_test_...`
  - Llave secreta: `sk_test_...`
- [ ] CLI de Supabase instalado y logueado (`supabase login`) y el proyecto linkeado
  (`supabase link --project-ref zecysscsehgejdklvcva`).

---

## 1. Encender Culqi en sandbox

- [ ] **Aplicar la migración 031** (columnas de cobro en `purchases`).
  SQL Editor de Supabase → pega y ejecuta el contenido de
  `supabase/migrations/031_purchases_payment_provider.sql`.
- [ ] **Guardar la llave secreta** como secret del servidor (NO en el front):
  ```bash
  supabase secrets set CULQI_SECRET_KEY=sk_test_TU_LLAVE
  ```
- [ ] **Desplegar las Edge Functions:**
  ```bash
  supabase functions deploy culqi-charge
  supabase functions deploy culqi-webhook
  ```
- [ ] **Front:** en Vercel (proyecto contact-hub-knmq) → Settings → Environment
  Variables → agrega `VITE_CULQI_PUBLIC_KEY = pk_test_TU_LLAVE` → **Redeploy**.
  (Para probar en local: ponla en `.env.local` y `npm run dev`.)
- [ ] (Opcional) En el panel de Culqi registra el webhook de eventos de cargo:
  `https://zecysscsehgejdklvcva.functions.supabase.co/culqi-webhook`

**Checkpoint:** entra a `/precios`. Debe aparecer el botón verde
**"Pagar con tarjeta o Yape"** en los planes. Si NO aparece, `VITE_CULQI_PUBLIC_KEY`
no está cargada (revisa el redeploy).

---

## 2. Datos de prueba de Culqi

> Confirma los valores vigentes en la doc/panel de Culqi (pueden cambiar). Los
> típicos de sandbox:
- Tarjeta Visa: `4111 1111 1111 1111`
- Vencimiento: cualquier fecha futura (ej. `09/2030`)
- CVV: `123`
- Email: usa el correo de tu usuario de prueba.
- Yape sandbox: usa el número/OTP de prueba que indique Culqi en su panel.

---

## 3. E2E test A — Acceso total (pago directo, sin selector)

- [ ] Abre una ventana de incógnito. En `/auth` **regístrate con un correo nuevo**
  de prueba (ej. `test1+culqi@tucorreo.com`). Completa el onboarding.
- [ ] Ve a `/precios` → plan **Acceso completo (S/360)** → **"Pagar con tarjeta o Yape"**.
- [ ] Paga con la tarjeta de prueba. Debe salir toast **"¡Pago confirmado! Tu acceso quedó activo."** y redirigir a `/mis-contactos`.
- [ ] Abre cualquier carpeta del catálogo → **los teléfonos se ven completos** + botón **"Consultar por WhatsApp"** funciona.
- [ ] Verifica en BD (paso 6, consulta A).

**Esperado:** 1 fila en `purchases` (provider `culqi`, status `active`) y acceso
total (no crea filas en `user_category_access`; lo cubre el plan total).

---

## 4. E2E test B — Plan multi-carpeta (con selector de carpetas)

- [ ] Con **otro correo nuevo** (`test2+culqi@...`), en `/precios` elige **Starter (4 carpetas)** → **"Pagar con tarjeta o Yape"**.
- [ ] Se abre **"Elige tus carpetas"** → selecciona 4 → **"Continuar al pago"** → paga.
- [ ] Toast de éxito → `/mis-contactos` muestra **esas 4 carpetas** con teléfonos completos; **las demás siguen enmascaradas**.
- [ ] Intenta seleccionar una 5ª carpeta en el selector: debe **bloquearse** (límite 4).
- [ ] Verifica en BD (paso 6, consulta B): 1 `purchases` activa + **4 filas** en `user_category_access`.

---

## 5. E2E test C — Casos negativos / seguridad

- [ ] **Pago rechazado:** usa la tarjeta/monto de rechazo de Culqi (ver su doc). Debe salir un toast con el mensaje de error de Culqi y **NO** activar acceso (0 filas nuevas en `purchases`).
- [ ] **Idempotencia:** no debería poder activarse dos veces el mismo cargo (lo protege el índice único `provider_charge_id`).
- [ ] **Seguridad (regresión):** con una **cuenta gratis distinta** (sin pagar), abre una carpeta → teléfonos **enmascarados**; y en el SQL Editor corre la consulta C (paso 6): debe dar **0 teléfonos legibles**.

---

## 6. Consultas de verificación (SQL Editor de Supabase)

Reemplaza `TEST_USER_ID` por el id del usuario de prueba
(`select id,email from auth.users order by created_at desc limit 5;`).

**A) Compra por Culqi (test A y B):**
```sql
select id, user_id, plan_id, status, provider, provider_charge_id, amount, paid_at
from public.purchases
where provider = 'culqi'
order by created_at desc
limit 10;
```
Esperado: fila(s) con `status='active'`, `provider='culqi'`, `amount` correcto.

**B) Carpetas concedidas (test B):**
```sql
select c.name, uca.status, uca.created_at
from public.user_category_access uca
join public.categories c on c.id = uca.category_id
where uca.user_id = 'TEST_USER_ID'
order by uca.created_at desc;
```
Esperado: exactamente las carpetas elegidas, `status='active'`.

**C) Seguridad — un usuario gratis NO lee teléfonos (usa el id de una cuenta SIN pago):**
```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"FREE_USER_ID","role":"authenticated"}', true);
select count(*) as filas, count(phone) as telefonos_legibles from public.contacts;
rollback;
```
Esperado: `telefonos_legibles = 0`.

---

## 7. Limpiar datos de prueba (antes de ir a producción)

```sql
-- Reemplaza por los ids de tus usuarios de prueba
delete from public.user_category_access where user_id in ('TEST_USER_ID_1','TEST_USER_ID_2');
delete from public.purchases           where user_id in ('TEST_USER_ID_1','TEST_USER_ID_2');
delete from public.trial_claims        where user_id in ('TEST_USER_ID_1','TEST_USER_ID_2');
```
Y borra los usuarios de prueba desde Supabase → Authentication → Users.

---

## 8. Go-live (producción)

- [ ] Repite el paso 1 con las llaves **`pk_live_...` / `sk_live_...`**:
  - `supabase secrets set CULQI_SECRET_KEY=sk_live_...`
  - `VITE_CULQI_PUBLIC_KEY=pk_live_...` en Vercel → redeploy.
- [ ] Haz **una compra real pequeña** (ej. Carpeta Individual S/20) para confirmar el circuito con dinero real, luego reembólsala desde el panel de Culqi si quieres.
- [ ] El **Yape manual sin comisión** sigue disponible como respaldo en todos los planes.

---

## Troubleshooting

- **No aparece el botón de pago:** falta `VITE_CULQI_PUBLIC_KEY` (o no redeployaste Vercel).
- **"Culqi no está configurado (falta CULQI_SECRET_KEY)":** falta el secret en Supabase o no redeployaste las functions.
- **Cobró pero no activó:** revisa logs de la función (`supabase functions logs culqi-charge`); el webhook (`culqi-webhook`) reconcilia como red de seguridad.
- **Plan multi-carpeta no concede:** confirma que enviaste `categoryIds` (el selector) y que no superan el `folder_limit`.
