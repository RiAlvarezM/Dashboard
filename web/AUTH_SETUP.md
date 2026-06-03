# Autenticación con Supabase - Setup

## ✅ Instalación completada

Se agregó autenticación completa con Supabase Auth:

### Archivos creados:
- ✨ `lib/auth.ts` - Funciones de autenticación
- ✨ `app/auth/page.tsx` - Página de login/signup
- ✨ `middleware.ts` - Protección de rutas
- ✨ `components/user-menu.tsx` - Menú de usuario

### Archivos modificados:
- 📝 `components/layout/sidebar.tsx` - Agregado UserMenu
- 📝 `package.json` - Agregada dependencia @supabase/ssr

---

## 🚀 Para empezar

### 1. Instalar dependencias
```bash
cd web
npm install
```

### 2. Probar localmente
```bash
npm run dev
```

Abre `http://localhost:3000`

### 3. Serás redirigido a `/auth`

Verás una página de login con dos opciones:
- **Crear cuenta** - Nuevo usuario
- **Ingresar** - Usuario existente

### 4. Crear una cuenta de prueba
- Email: `test@example.com`
- Password: `TestPassword123`
- Nombre: `Test User`

Click "Crear cuenta"

### 5. Ahora verás el dashboard 🎉

- Dashboard cargado con tu usuario
- En el sidebar (abajo a la izquierda) verás tu email
- Botón "Cerrar sesión"

---

## 🔒 Cómo funciona

### Flujo de autenticación:

```
Usuario → /auth (login/signup)
   ↓
Supabase valida credenciales
   ↓
Si es válido → Redirige a /analisis
   ↓
Middleware protege todas las rutas
   ↓
Si no estás logueado → /auth
```

### Componentes:

1. **lib/auth.ts** - Funciones de login, signup, logout
2. **middleware.ts** - Protege rutas (solo usuarios logueados)
3. **app/auth/page.tsx** - Página de autenticación
4. **components/user-menu.tsx** - Muestra usuario + botón logout

---

## 🔧 Configuración en Supabase

La autenticación funciona automáticamente, pero puedes:

1. Ir a Supabase → Authentication
2. Ver usuarios registrados
3. Cambiar configuración de email, MFA, etc.

---

## 📝 Próximos pasos

Cuando despliegues a Vercel:

1. **Agrega variables de entorno en Vercel:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Configura Email en Supabase** (opcional)
   - Por defecto, Supabase usa un servicio de email
   - En producción, puedes configurar tu propio SMTP

3. **Habilita autenticación en Supabase**
   - Ve a Settings → Authentication
   - Desactiva "Email confirmations" si quieres signup inmediato

---

## 🔐 Seguridad

✅ **Lo que está protegido:**
- Todas las rutas requieren login (excepto /auth)
- Las contraseñas se envían hasheadas a Supabase
- Tokens JWT automáticos
- HTTPS en producción

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Email already registered" | Usa otro email en signup |
| No se puede crear cuenta | Verifica conexión a Supabase |
| No ve el UserMenu | Recarga la página |
| Logout redirige mal | Verifica que /auth existe |

---

## 📚 Próxima mejora

Cuando tengas tiempo, puedes:
- Agregar avatar de usuario
- Email de confirmación
- Google/GitHub login
- Two-factor authentication

Pero por ahora, **está 100% funcional** ✨
