# Migración de Cloudflare a Supabase ✅

## Cambios realizados

### 📦 Dependencias
- ❌ Removido: `@cloudflare/next-on-pages`, `@cloudflare/workers-types`
- ✅ Agregado: `@supabase/supabase-js`

### 📝 Código de datos
- **lib/data.ts** - Reescrito completamente para usar Supabase
  - Todas las funciones ahora usan `supabase` client en lugar de bindings de Cloudflare
  - Soporta tanto desarrollo local como producción
  - Las funciones son más simples (sin parámetros de `env`)

### 🔧 API Routes
- **Todos los archivos en `app/api/`** - Actualizados
  - Removidas referencias a `getRequestContext()`
  - Removidas referencias a `@cloudflare/next-on-pages`
  - Removidas líneas `export const runtime = "edge"`
  - Las funciones ahora reciben parámetros directamente de `lib/data.ts`

### 📋 Configuración
- **next.config.ts** - Simplificado
  - Removida configuración de Cloudflare Pages
  
- **.env.local.example** - Creado
  - Plantilla para variables de entorno

- **db/schema-supabase.sql** - Creado
  - Schema PostgreSQL para Supabase
  - Tablas: `cuentas`, `networth`, `flows`, `puntos`, `propiedades`, `config`

- **.gitignore** - Actualizado
  - Agregado `.env.local`
  - Agregados directorios de desarrollo

### 🚀 Scripts
- **scripts/migrate-to-supabase.mjs** - Creado
  - Migra datos de CSV/JSON locales a Supabase
  - Uso: `npm run migrate:supabase`

- **package.json** - Actualizado
  - Agregado script `migrate:supabase`

### 📚 Documentación
- **SUPABASE_SETUP.md** - Guía de instalación
- **MIGRATION_SUMMARY.md** - Este archivo

---

## Próximos pasos

### 1️⃣ Crear proyecto en Supabase
```bash
# Ve a https://app.supabase.com y crea un nuevo proyecto
# Nombre: dashboard-financiero
```

### 2️⃣ Configurar variables de entorno
```bash
cd web
cp .env.local.example .env.local

# Edita .env.local con tus credenciales de Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3️⃣ Crear schema
```bash
# En Supabase SQL Editor, copia y pega db/schema-supabase.sql
```

### 4️⃣ Instalar dependencias
```bash
npm install
```

### 5️⃣ Migrar datos (opcional)
```bash
# Si tienes datos locales, agrega SUPABASE_SERVICE_KEY a .env.local
npm run migrate:supabase
```

### 6️⃣ Desarrollar localmente
```bash
npm run dev
# Abre http://localhost:3000
```

---

## Ventajas de Supabase vs Cloudflare

| Aspecto | Supabase | Cloudflare D1 |
|---------|----------|--------------|
| Base de datos | PostgreSQL (estándar) | SQLite (limitado) |
| Seguridad | RLS + Auth nativa | Manual |
| Desarrollo local | Fácil | Requiere emulador |
| Costo | Gratuito + Pro | Gratuito + uso |
| Documentación | Excelente | Buena |

---

## Seguridad

✅ Tus credenciales están protegidas:
- `.env.local` está en `.gitignore`
- `SUPABASE_SERVICE_KEY` nunca se expone al cliente
- Solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` se envía al navegador

---

## Rollback (si es necesario)

Si necesitas volver a Cloudflare:
```bash
git log --oneline
git revert [commit-hash]
```

Pero **Supabase es más simple** 🚀

---

## Ayuda

Si tienes problemas:

1. Lee [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Verifica las variables de entorno: `echo $NEXT_PUBLIC_SUPABASE_URL`
3. Consulta [Docs de Supabase](https://supabase.com/docs)

¡Listo para desarrollar! 🎉
