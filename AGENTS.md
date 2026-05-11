# AGENTS (dinerance-dashboard)

## Rol y limites
- Frontend Next.js App Router para Dinerance.
- Repo independiente: commitea desde `dinerance-dashboard/`.
- Depende de `dinerance-api` y de Supabase Auth.

## Comandos reales (fuente de verdad)
- Instalar deps: `npm install`
- Desarrollo local (webpack): `npm run dev`
- Dev alterno (turbopack): `npm run dev:turbopack`
- Lint: `npm run lint`
- Tests: `npm run test`
- Build de verificacion: `npm run build`
- Test puntual: `npx vitest run app/app/balance/page.test.tsx`

## Variables obligatorias
- `NEXT_PUBLIC_API_BASE_URL` (URL del backend)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Como se conecta con el API
- Cliente HTTP central: `lib/api.ts`.
- Si falta `NEXT_PUBLIC_API_BASE_URL`, la app falla temprano (`Missing NEXT_PUBLIC_API_BASE_URL`).
- El token de Supabase se agrega como `Authorization: Bearer <token>` en requests autenticados.

## Flujo de autenticacion relevante
- Session handling en `components/providers/auth-provider.tsx`.
- Cliente Supabase en `lib/supabase/client.ts`.
- Login/register/callback en `app/auth/*`.

## Convenciones utiles para no romper UX
- Textos y copy centralizados en `lib/site.ts` (es/en); evita hardcodear strings nuevos en paginas.
- Alias `@/*` configurado en `tsconfig.json` y `vitest.config.ts`; mantenlo consistente.

## Entrypoints para cambios
- Root layout/providers: `app/layout.tsx`
- Layout protegido app: `app/app/layout.tsx`
- Pantallas principales: `app/app/*/page.tsx`
- API wrapper/tipos compartidos: `lib/api.ts`

## Conexion con el backend
- El backend debe permitir el origen del dashboard en `CORS_ORIGINS`.
- Para local, usualmente: dashboard en `http://localhost:3000` y API en `http://127.0.0.1:8000`.
