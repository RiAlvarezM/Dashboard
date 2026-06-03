# Dashboard Financiero Personal

Este repositorio contiene un sistema de gestión y visualización de finanzas personales, compuesto por dos aplicaciones principales:

1. **Aplicación Python (Streamlit)**: Aplicación local interactiva para la gestión de datos financieros utilizando archivos locales CSV/JSON.
2. **Aplicación Web (Next.js)**: Dashboard moderno e interactivo desplegado en la web, que utiliza **Supabase (PostgreSQL)** como base de datos persistente.

---

## Estructura del Proyecto

```text
├── Inicio.py               # Aplicación principal de Streamlit
├── api.py                  # API de comunicación
├── app.py                  # Servidor de aplicación
├── utils.py                # Utilidades y cálculos en Python
├── web/                    # Aplicación Web (Next.js)
│   ├── app/                # Rutas y componentes (App Router)
│   ├── lib/data.ts         # Capa de datos conectada a Supabase
│   ├── db/                 # Schemas SQL para la base de datos
│   └── package.json        # Dependencias y scripts frontend
└── *.csv / *.json          # Archivos de datos locales (Streamlit)
```

---

## Aplicación Web (Next.js + Supabase)

La aplicación web fue migrada exitosamente para utilizar **Supabase** como base de datos persistente en la nube.

### Tecnologías Utilizadas
- **Framework**: Next.js 16 (React 19, TypeScript)
- **Base de Datos**: Supabase (PostgreSQL)
- **Gráficos**: Recharts
- **Estilos**: Tailwind CSS 4

### Configuración de la App Web
Para levantar el frontend localmente apuntando a tu base de datos de Supabase:

1. Instala las dependencias:
   ```bash
   cd web
   npm install
   ```
2. Crea tu archivo de entorno `.env.local` con las credenciales de tu proyecto de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Aplicación Python (Streamlit)

Para ejecutar el panel local en Python:

```bash
pip install streamlit pandas
streamlit run Inicio.py
```
