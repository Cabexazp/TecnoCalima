# Nexora

Tienda tecnologica creada con React, Vite y Supabase.

## Desarrollo local

```bash
npm install
npm run dev
```

## Conectar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el contenido de `supabase.sql` en el SQL Editor.
3. Copia `.env.example` como `.env.local`.
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Reinicia el servidor local.

## Desplegar en Vercel

1. Importa este repositorio desde Vercel.
2. Configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Usa `npm run build` como comando de build y `dist` como salida.
