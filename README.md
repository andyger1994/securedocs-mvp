# Liconex MVP

MVP web SaaS para documentacion interactiva profesional de instalaciones de seguridad electronica.

## Funcionalidades incluidas

- Dashboard con proyectos mock, creacion de nuevos proyectos y resumen de dispositivos.
- Fanpage SaaS en `/` con boton de ingreso al dashboard.
- Login mock en `/login` con usuario `Liconex` y contrasena `Liconex`.
- Dashboard operativo en `/dashboard`.
- Vista de proyecto con plano base mock, subida de imagen/PDF, zoom y desplazamiento.
- Modo dibujo para crear paredes y ambientes directamente sobre el plano.
- Trazado de cableado con tipo de instalacion: subterraneo, embutido, caño galvanizado o ducto PVC.
- Puntos de registro/caja de paso vinculables al dispositivo seleccionado.
- Proyectos nuevos con plano en blanco para dibujar desde cero.
- Separacion por pisos/planos: Piso 1, Piso 2, Piso 3, etc.
- Capas activables: CCTV, Control de acceso, Alarma, Red y Energia.
- Editor con drag and drop de dispositivos de CCTV, acceso, alarma, red, energia y audio.
- Dispositivos movibles sobre el plano.
- Panel lateral para consultar y editar ficha tecnica basica.
- Modo visualizacion en `/share/[projectId]` sin herramientas de edicion.
- Modelos TypeScript y esquema inicial de Supabase.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React-Konva / Konva
- Supabase preparado, con datos mock por ahora
- Zustand para estado local del prototipo

## Correr localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

> En este entorno de Codex no hay `npm` disponible en el PATH, por eso no pude instalar dependencias ni iniciar el servidor desde aqui. Los archivos del proyecto ya estan listos para instalarse en una terminal con Node/npm.

## Variables de entorno

Crear `.env.local` cuando se configure Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

El cliente esta preparado en `src/lib/supabase.ts`. La app usa mocks/localStorage hasta reemplazar el store por llamadas reales.

## Base de datos

El esquema inicial esta en `supabase/schema.sql` e incluye:

- organizations
- users
- projects
- floors
- plan_elements
- devices
- device_files
- maintenance_notes

## Estructura

```text
src/
  app/
    page.tsx
    dashboard/page.tsx
    projects/[projectId]/page.tsx
    share/[projectId]/page.tsx
  components/
    app-shell.tsx
    dashboard.tsx
    device-details-panel.tsx
    device-palette.tsx
    layer-controls.tsx
    plan-canvas.tsx
    landing-page.tsx
    liconex-logo.tsx
    login-page.tsx
    project-workspace.tsx
  lib/
    device-catalog.ts
    mock-data.ts
    store.ts
    supabase.ts
    types.ts
supabase/
  schema.sql
```

## Siguientes conexiones backend

- Reemplazar `src/lib/store.ts` por repositorios Supabase.
- Guardar planos y archivos de dispositivos en Supabase Storage.
- Agregar autenticacion, organizaciones y permisos por rol.
- Generar links compartibles con token/slug y politicas RLS.
