# ✅ TODO: Migración de Credenciales Legacy a Supabase

## Descripción
Reemplazar las antiguas credenciales de Cloudflare/Railway con las nuevas de Supabase.

---

## 📋 Checklist de Migración

### Fase 1: Preparar Supabase
- [ ] Crear nuevo proyecto en [Supabase](https://app.supabase.com)
  - Nombre: `dashboard-financiero`
  - Región: La más cercana a ti
  - Esperar ~2 minutos a que se inicialice

- [ ] Copiar credenciales del proyecto
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` desde Settings → API → Project URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde Settings → API → Anon (public)
  - [ ] `SUPABASE_SERVICE_KEY` desde Settings → API → Service role secret

### Fase 2: Configurar ambiente local
- [ ] Editar `.env.local` en `web/`
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
  ```

- [ ] Verificar que `.env.local` está en `.gitignore`
  ```bash
  grep "\.env\.local" .gitignore
  ```

### Fase 3: Crear schema en Supabase
- [ ] Ir a Supabase → SQL Editor
- [ ] Crear nueva query
- [ ] Copiar contenido de `db/schema-supabase.sql`
- [ ] Ejecutar (Run)
- [ ] Verificar que las tablas se crearon:
  - `cuentas`
  - `networth`
  - `flows`
  - `puntos`
  - `propiedades`
  - `config`

### Fase 4: Instalar dependencias
- [ ] Ejecutar en `web/`:
  ```bash
  npm install
  ```

- [ ] Verificar que `@supabase/supabase-js` está instalado:
  ```bash
  grep "@supabase/supabase-js" package.json
  ```

### Fase 5: Migrar datos (opcional pero recomendado)
- [ ] Verificar que tienes los datos locales:
  - [ ] `cuentas.csv`
  - [ ] `networth_db.csv`
  - [ ] `flow_data.csv` (opcional)
  - [ ] `puntos_db.csv` (opcional)
  - [ ] `propiedades.csv` (opcional)
  - [ ] `perfil.json`
  - [ ] `tarjetas.json`
  - [ ] `vehiculos.json`
  - [ ] `prestamos.json`
  - [ ] `puntos.json`

- [ ] Migrar datos a Supabase:
  ```bash
  npm run migrate:supabase
  ```

- [ ] Verificar en Supabase que los datos se cargaron correctamente
  - Ir a cada tabla en Supabase y contar registros

### Fase 6: Probar desarrollo local
- [ ] Iniciar servidor:
  ```bash
  npm run dev
  ```

- [ ] Abrir `http://localhost:3000` y verificar que carga

- [ ] Probar funciones principales:
  - [ ] Ver dashboard (Análisis)
  - [ ] Acceder a Configuración
  - [ ] Crear un registro de networth
  - [ ] Ver datos en Patrimonio

### Fase 7: Limpiar credenciales legacy
- [ ] Remover variable `SUPABASE_SERVICE_KEY` de `.env.local` (si la agregaste)
  ```bash
  # Edita .env.local y borra esa línea
  ```

- [ ] Desactivar/eliminar proyectos legacy en:
  - [ ] Cloudflare (si los tienes)
  - [ ] Railway (si los tienes)

### Fase 8: Actualizar documentación
- [ ] Leer `SUPABASE_SETUP.md` para referencia futura
- [ ] Guardar contraseña de Supabase en gestor de contraseñas seguro
- [ ] Agregar credenciales a variables de entorno en el servidor (si despliegas)

### Fase 9: Despliegue a producción (cuando esté listo)
- [ ] Elegir plataforma:
  - [ ] **Vercel** (recomendado para Next.js)
  - [ ] Railway
  - [ ] Netlify
  - [ ] Otro

- [ ] Agregar variables de entorno en la plataforma:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
  ```

- [ ] Desplegar y verificar que funciona en producción

---

## 🔐 Notas de Seguridad

⚠️ **IMPORTANTE:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - OK commitear (es pública)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - OK commitear (se envía al navegador)
- ❌ `SUPABASE_SERVICE_KEY` - NUNCA commitear (es privada)
- ❌ `.env.local` - NUNCA commitear (está en .gitignore)

---

## 📝 Credenciales Legacy a Reemplazar

Identifica y reemplaza en todo el código:
- [ ] ~~`CLOUDFLARE_D1_DATABASE_ID`~~ → Ya no se usa
- [ ] ~~`CLOUDFLARE_KV_NAMESPACE_ID`~~ → Ya no se usa
- [ ] ~~`CLOUDFLARE_API_TOKEN`~~ → Ya no se usa
- [ ] ~~`RAILWAY_DB_URL`~~ → Ya no se usa

---

## ✨ Después de completar

Cuando termines:
1. ✅ El código funciona localmente
2. ✅ Los datos se migraron a Supabase
3. ✅ Puedes desarrollar sin dependencias de Cloudflare
4. ✅ Puedes desplegar a cualquier plataforma (Vercel, Railway, etc.)

---

## 🆘 Troubleshooting

Si tienes problemas:

| Problema | Solución |
|----------|----------|
| `Error: Missing NEXT_PUBLIC_SUPABASE_URL` | Verifica `.env.local` existe y está correcto |
| `Error: relation "cuentas" does not exist` | El schema no se creó - vuelve a ejecutar `schema-supabase.sql` |
| `Connection refused` | Supabase puede estar down - verifica [status.supabase.com](https://status.supabase.com) |
| Datos no se migraron | Verifica que `SUPABASE_SERVICE_KEY` es correcta, ejecuta `npm run migrate:supabase` de nuevo |

---

## 📚 Referencias

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guía detallada
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Cambios técnicos
- [Docs de Supabase](https://supabase.com/docs)

---

**Status:** ⏳ Pendiente  
**Prioridad:** 🔴 Alta  
**Fecha estimada:** Hoy
