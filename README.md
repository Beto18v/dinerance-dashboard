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
  layout.tsx                → Layout raíz: AuthProvider + Toaster
  login/page.tsx            → Login con email y contraseña
  app/
    layout.tsx              → Layout protegido con navegación y logout
    transactions/page.tsx   → Crear y listar transacciones con filtros
    categories/page.tsx     → Crear y listar categorías
    profile/page.tsx        → Ver perfil del usuario autenticado
lib/
  api.ts                    → Cliente HTTP tipado (agrega Bearer token, parsea errores)
  cache.ts                  → Utilidad de caché con localStorage (stale-while-revalidate)
  supabase/client.ts        → Singleton del cliente Supabase browser
components/
  providers/auth-provider.tsx  → Contexto de sesión + hook useSession()
  ui/                          → Componentes shadcn/ui generados
```

## Funcionalidades

- **Login / Logout** con Supabase Auth (email + contraseña).
- **Rutas protegidas**: todo bajo `/app/*` requiere sesión activa; redirige a `/login` si no la hay.
- **Perfil**: sincroniza datos del usuario desde `GET /users/me`.
- **Categorías**: crear (nombre, dirección, categoría padre opcional) y listar.
- **Transacciones**: crear y listar con filtros por categoría, fecha inicio y fecha fin.
- **Caché local**: los datos se muestran instantáneamente desde `localStorage` y se actualizan en background en cada visita. Al usar otro dispositivo se carga desde el backend y se guarda el nuevo caché.

## Build de producción

```bash
npm run build
npm run start
```
