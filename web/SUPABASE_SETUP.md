# Supabase Setup Guide

Esta guía te ayudará a configurar Supabase para el Dashboard Financiero.

## 1. Crear un proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Click en "New Project"
3. Rellena los detalles:
   - **Name**: `dashboard-financiero`
   - **Database Password**: Crea una contraseña fuerte
   - **Region**: Elige la más cercana a tu ubicación
4. Click "Create new project" y espera ~2 minutos a que se inicialice

## 2. Obtener credenciales

1. Una vez creado, ve a **Settings → API**
2. Copia los siguientes valores:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key (rol públic)
   - `SUPABASE_SERVICE_KEY`: Service key (en la sección "Service role key") - **MANTÉN ESTO SECRETO**

## 3. Configurar variables de entorno

```bash
cd web

# Crea .env.local
cp .env.local.example .env.local

# Edita .env.local y pega las credenciales:
# NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 4. Crear el schema en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com) → Tu proyecto → SQL Editor
2. Click "New Query"
3. Copia y pega el contenido de `db/schema-supabase.sql`
4. Click "Run"

✅ El schema estará listo

## 5. Migrar tus datos (opcional)

Si tienes datos locales en CSV/JSON, puedes migrarlos a Supabase:

```bash
cd web

# Agrega SUPABASE_SERVICE_KEY a .env.local (temporalmente)
echo "SUPABASE_SERVICE_KEY=eyJhbGc..." >> .env.local

# Ejecuta la migración
npm install
node scripts/migrate-to-supabase.mjs

# Elimina SUPABASE_SERVICE_KEY de .env.local después
```

## 6. Desarrollar localmente

```bash
cd web

npm install
npm run dev
```

La app funcionará en `http://localhost:3000` ✨

## 7. Desplegar a producción

### Opción A: Vercel (recomendado)

```bash
npm install -g vercel
vercel

# Agrega variables de entorno en Vercel:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Opción B: Railway, Render, etc.

Solo agrega las mismas variables de entorno.

## Troubleshooting

### "Error: Missing NEXT_PUBLIC_SUPABASE_URL"

- Verifica que `.env.local` existe
- Verifica que las variables están correctas
- Reinicia el servidor: `npm run dev`

### "Error: relation "cuentas" does not exist"

- El schema no fue creado correctamente
- Vuelve al paso 4 e intenta de nuevo

### Migraciones lentas

- Supabase tiene límites en plan free
- Si tienes muchos datos, usa el plan Pro ($25/mes)

## Variables de entorno seguras

🔐 **NUNCA** commits `.env.local` al git

```bash
# .env.local SIEMPRE debe estar en .gitignore
cat .gitignore | grep "\.env"
```

## Recursos

- 📚 [Docs de Supabase](https://supabase.com/docs)
- 🐛 [Status page](https://status.supabase.com)
- 💬 [Community Discord](https://discord.supabase.com)
