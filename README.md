# Dinerance Dashboard

Frontend del proyecto Dinerance. Construido con Next.js 16 App Router, shadcn/ui, Tailwind CSS y Supabase Auth. Consume la API REST de `dinerance-api`.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase JS
- React Hook Form + Zod
- Sonner

## Variables de entorno

Crea `.env.local` en la raiz del proyecto para desarrollo local. Se parte
de `.env.local.example`. Usa `.env.example` solo como referencia de las
variables requeridas para despliegue. Deja las variables de produccion
configuradas en Vercel.

```env
# Desarrollo local: backend FastAPI corriendo en maquina
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Obligatorias: proyecto Supabase -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>

# Recomendada en local para OAuth
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La `anon key` es publica. No uses `service_role` en el frontend.
`NEXT_PUBLIC_SITE_URL` ya no es obligatoria para Google OAuth: el frontend usa primero el origen real del navegador para evitar redirects a `localhost` en Vercel.

Para produccion configurar estas variables en Vercel:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
NEXT_PUBLIC_SITE_URL=https://tu-dashboard.vercel.app
```

## Instalacion y ejecucion

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

`npm run dev` usa Webpack en local para evitar el panic de Turbopack que se
esta presentando en algunos entornos Windows con Next 16. Si quieres volver a
probar Turbopack de forma explicita, usa `npm run dev:turbopack`.

Requisito previo: el backend `dinerance-api` debe estar corriendo en la URL configurada en `NEXT_PUBLIC_API_BASE_URL`. Con la configuracion local de arriba, el backend esperado es `http://127.0.0.1:8000`.

## Estructura

```text
app/
  auth/
    callback/page.tsx       -> Finaliza OAuth y bootstrap del perfil
    login/page.tsx          -> Login con email/contrasena y Google
    register/page.tsx       -> Registro con email/contrasena y Google
  app/
    layout.tsx              -> Layout protegido con guard de sesion/perfil
    balance/page.tsx
    categories/page.tsx
    profile/page.tsx
    transactions/page.tsx
components/
  auth/
    google-auth-button.tsx  -> Boton reutilizable para Google OAuth
  providers/
    auth-provider.tsx
    site-preferences-provider.tsx
    theme-provider.tsx
lib/
  api.ts                    -> Cliente HTTP tipado hacia el backend
  auth.ts                   -> Helpers de Google OAuth y bootstrap de perfil
  cache.ts
  site.ts
  supabase/client.ts
```

## Funcionalidades

- Registro, login y logout con Supabase Auth.
- Login y registro con Google via Supabase OAuth.
- Callback dedicado en `/auth/callback` para terminar OAuth y llamar `POST /users/me/bootstrap`.
- Rutas protegidas bajo `/app/*`.
- Perfil editable, categorias, transacciones y balance.
- i18n es/en y preferencias de tema.

## Flujo Google

1. El usuario pulsa Google en `login` o `register`.
2. Supabase redirige a Google y luego vuelve a `<origen-actual>/auth/callback`.
3. El callback obtiene la sesion y llama al backend para crear o sincronizar el perfil local.
4. Si todo sale bien, redirige a `/app/balance`.

## Deploy en Vercel

- Framework Preset: `Next.js` (auto-detectado)
- Root Directory: raiz del repo `dinerance-dashboard`
- Install Command: automatico (`npm install`)
- Build Command: automatico desde `package.json` (`npm run build` -> `next build`)
- Output Directory: automatica de Next.js

### Variables para Vercel

Obligatorias:

- `NEXT_PUBLIC_API_BASE_URL=https://dinerance-api-prod.azurewebsites.net`
- `NEXT_PUBLIC_SUPABASE_URL=<tu valor actual de Supabase>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu valor actual anon/public>`

Recomendada:

- `NEXT_PUBLIC_SITE_URL=https://tu-dominio-produccion`

### Ajustes en Supabase Auth

En Supabase Dashboard -> Authentication -> URL Configuration:

- `Site URL`: tu dominio publico de produccion en Vercel
- Redirect URLs:
  - `https://tu-dominio-produccion/auth/callback`
  - `http://localhost:3000/**`
  - `https://*-<team-or-account-slug>.vercel.app/**`

### Ajustes en Google Provider

Si usas Google via Supabase, en Google Cloud el redirect URI autorizado debe ser el callback de Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`), no el dominio del frontend. El dominio del frontend se controla en Supabase URL Configuration con `Site URL` y `Redirect URLs`.

## Build de produccion

```bash
npm run build
npm run dev
```
