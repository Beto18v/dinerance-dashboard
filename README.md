# Dinerance Dashboard

Frontend de Dinerance construido con Next.js App Router. Consume `dinerance-api` y concentra autenticacion, caja actual, analytics, obligaciones, caja futura e importacion CSV.

## Estado actual

Hoy el dashboard ya incluye:

- login, registro y callback OAuth con Supabase Auth
- bootstrap del perfil local despues de autenticar
- layout protegido para `/app/*`
- `Resumen` con caja actual, cuentas, actividad reciente, transferencias y ajustes
- `Analisis` con resumen mensual, breakdown por categoria y candidatos recurrentes
- `Caja futura` con forecast y safe-to-spend
- `Obligaciones` con listado, edicion, pausa, archivo y pago
- `Transacciones` con filtros, paginacion server-side y modal de importacion CSV
- `Perfil` con preferencias, perfil financiero y cuentas financieras
- textos `es/en` y preferencia de tema

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase JS
- React Hook Form
- Zod
- Sonner
- Vitest

## Estructura actual

```text
app/
  auth/
    callback/page.tsx
    login/page.tsx
    register/page.tsx
  app/
    analysis/page.tsx
    balance/page.tsx
    cashflow/page.tsx
    categories/page.tsx
    obligations/page.tsx
    profile/page.tsx
    transactions/page.tsx
components/
  providers/
  ui/
lib/
  api.ts
  auth.ts
  financial-accounts.ts
  finance.ts
  profile.ts
  site.ts
  supabase/
```

## Estado funcional por pantalla

### Autenticacion

- email y contrasena
- Google OAuth
- callback dedicado en `/auth/callback`
- bootstrap automatico del perfil local despues de iniciar sesion

### Resumen

- caja actual consolidada
- caja por cuenta
- actividad reciente del ledger
- acciones para transferir y ajustar saldo
- resumen de obligaciones proximas

### Analisis

- lectura mensual de ingresos y gastos
- breakdown por categoria
- candidatos recurrentes

### Caja futura

- forecast a 30, 60 y 90 dias
- safe-to-spend
- lectura de cobertura o shortfall

### Obligaciones

- creacion y edicion de obligaciones
- pausa, archivo y eliminacion
- pago con cuenta real y fecha real

### Transacciones

- formulario para `income` y `expense`
- filtros por categoria, grupo y rango de fechas
- paginacion server-side
- resumen del filtro activo
- importacion CSV con analisis, revision y confirmacion

### Perfil

- nombre y preferencias de interfaz
- `base_currency`
- `timezone`
- cuentas financieras
- desactivacion de cuenta

## Reglas de interfaz vigentes

- El contexto actual es una sola cuenta personal por usuario autenticado.
- `Resumen` muestra caja actual; `Analisis` muestra lectura mensual.
- `Transacciones` opera solo con ingresos y gastos normales.
- Transferencias y ajustes se operan desde `Resumen`.
- La importacion CSV no decide reglas por su cuenta: muestra lo que resolvio el backend.
- `base_currency` y `timezone` condicionan montos, fechas y agregados mostrados.

## Variables de entorno

Desarrollo local:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La `anon key` es publica. No uses `service_role` en el frontend.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
```

`npm run dev` usa Webpack en local.

## Tests

La suite actual cubre:

- layout protegido
- pantalla de analisis
- pantalla de resumen
- pantalla de caja futura
- pantalla de categorias
- pantalla de obligaciones
- perfil financiero y cuentas financieras
- pantalla de transacciones
- modal de importacion CSV

Comando:

```bash
npm run test
```
