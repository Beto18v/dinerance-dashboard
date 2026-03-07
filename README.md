# Finance AI — Dashboard

Frontend del proyecto Finance AI. Construido con **Next.js 16 App Router**, **shadcn/ui**, **Tailwind CSS** y **Supabase Auth**. Consume la API REST de `finance-ai-api`.

## Stack

| Tecnología               | Uso                      |
| ------------------------ | ------------------------ |
| Next.js 16 (App Router)  | Framework frontend       |
| TypeScript               | Tipado estático          |
| Tailwind CSS + shadcn/ui | Estilos y componentes    |
| Supabase JS              | Autenticación (JWT)      |
| React Hook Form + Zod    | Formularios y validación |
| Sonner                   | Notificaciones toast     |

## Variables de entorno

Crea un archivo `.env` (o `.env.local`) en la raíz del proyecto con las siguientes variables:

```env
# URL base del backend FastAPI
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Proyecto Supabase — se obtienen en: supabase.com → tu proyecto → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

> La `anon key` es la clave pública del proyecto. **No uses** la `service_role` key en el frontend.

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

> **Requisito previo:** el backend (`finance-ai-api`) debe estar corriendo en el puerto configurado en `NEXT_PUBLIC_API_BASE_URL`.

## Estructura del proyecto

```
app/
  page.tsx                  → Redirige a /app/transactions
  layout.tsx                → Layout raíz: providers (Auth, Theme, SitePreferences) + Toaster
  auth/
    login/page.tsx          → Login con email y contraseña
    register/page.tsx       → Registro con creación de perfil en backend
  app/
    layout.tsx              → Layout protegido con navegación, guard de perfil y logout
    transactions/page.tsx   → CRUD de transacciones con filtros (categoría, rango de fechas)
    categories/page.tsx     → CRUD de categorías (nombre, dirección, padre opcional)
    profile/
      page.tsx              → Perfil del usuario (edición de nombre, eliminación de cuenta)
      components/
        preferences-card.tsx → Selector de idioma y tema
lib/
  api.ts                    → Cliente HTTP tipado (agrega Bearer token, parsea errores como ApiError)
  cache.ts                  → Utilidad de caché con localStorage (stale-while-revalidate)
  site.ts                   → Textos i18n (es/en) y helpers de locale
  utils.ts                  → Utilidades generales (cn para clases Tailwind)
  supabase/client.ts        → Singleton del cliente Supabase browser
components/
  providers/
    auth-provider.tsx       → Contexto de sesión + hook useSession() + clearUserCache en signOut
    site-preferences-provider.tsx → Contexto de idioma/locale + hook useSitePreferences()
    theme-provider.tsx      → Wrapper de next-themes
  ui/                       → Componentes shadcn/ui generados
```

## Funcionalidades

- **Registro / Login / Logout** con Supabase Auth (email + contraseña).
- **Rutas protegidas**: todo bajo `/app/*` requiere sesión activa y perfil existente en backend; redirige a `/auth/login` si no hay sesión o a `/auth/register` si no hay perfil.
- **Perfil**: sincroniza datos del usuario desde `GET /users/me`, edición de nombre con auto-save, eliminación de cuenta (soft delete en backend + signOut).
- **Categorías**: CRUD completo (crear, listar, editar, eliminar) con soporte de categoría padre y filtros por dirección.
- **Transacciones**: CRUD completo con filtros por categoría, fecha inicio y fecha fin.
- **Internacionalización (i18n)**: español e inglés, configurable desde Preferencias del perfil. Los textos se centralizan en `lib/site.ts`.
- **Tema**: claro, oscuro o sistema, configurable desde Preferencias.
- **Caché local**: los datos se muestran instantáneamente desde `localStorage` y se actualizan en background en cada visita. Al cambiar de usuario se limpia automáticamente.

## Build de producción

```bash
npm run build
npm run start
```
