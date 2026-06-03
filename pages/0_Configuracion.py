####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import os
import pandas as pd
import streamlit as st

####################################################################
# --- CONFIGURACIÓN ---
FILE_CUENTAS = 'cuentas.csv'
st.set_page_config(page_title="Configuración de Cuentas", layout="wide")

####################################################################
# --- FUNCIONES ---
def load_cuentas():
    """Carga el archivo de configuración de cuentas."""
    if not os.path.exists(FILE_CUENTAS):
        st.error(f"⚠️ No se encontró el archivo '{FILE_CUENTAS}'")
        return pd.DataFrame(columns=['Categoria', 'Nombre_Cuenta', 'Monto_Objetivo', 'Incluir', 'Ultimo_Valor'])
    df = pd.read_csv(FILE_CUENTAS)
    # Convertir la columna Incluir a booleano
    df['Incluir'] = df['Incluir'].astype(str).str.lower() == 'true'
    df['Monto_Objetivo'] = pd.to_numeric(df['Monto_Objetivo'], errors='coerce').fillna(0.0)
    if 'Ultimo_Valor' not in df.columns:
        df['Ultimo_Valor'] = 0.0
    df['Ultimo_Valor'] = pd.to_numeric(df['Ultimo_Valor'], errors='coerce').fillna(0.0)
    return df

def save_cuentas(df):
    """Guarda el archivo de configuración de cuentas."""
    # Asegurar que Incluir se guarda como booleano
    df_save = df.copy()
    df_save['Incluir'] = df_save['Incluir'].astype(bool)
    df_save.to_csv(FILE_CUENTAS, index=False)

####################################################################
# --- INTERFACE ---

st.title("⚙️ Configuración de Cuentas")
st.write("Aquí puedes configurar las cuentas que deseas incluir, sus montos objetivos esperados y si están activas.")

df_cuentas = load_cuentas()

# Separar por categoría
categorias = list(df_cuentas['Categoria'].unique())

# Crear tabs por categoría
tabs = st.tabs(categorias)

for tab, categoria in zip(tabs, categorias):
    with tab:
        st.subheader(f"📋 Gestión de {categoria}")
        
        df_categoria = df_cuentas[df_cuentas['Categoria'] == categoria].reset_index(drop=True)
        
        # Usar form para guardar cambios
        with st.form(key=f"form_{categoria}"):
            # Crear columnas para la edición
            col1, col2, col3, col4 = st.columns([3, 2, 1, 1])
            
            with col1:
                st.write("**Nombre Cuenta**")
            with col2:
                st.write("**Monto Objetivo**")
            with col3:
                st.write("**Activa**")
            with col4:
                st.write("**Eliminar**")
            
            st.divider()
            
            # Variables para almacenar cambios
            cambios = []
            
            for idx, row in df_categoria.iterrows():
                col1, col2, col3, col4 = st.columns([3, 2, 1, 1], vertical_alignment="center")
                
                with col1:
                    nombre = st.text_input(
                        "Nombre",
                        value=row['Nombre_Cuenta'],
                        key=f"{categoria}_nombre_{idx}",
                        label_visibility="collapsed"
                    )
                
                with col2:
                    monto = st.number_input(
                        "Monto",
                        value=float(row['Monto_Objetivo']),
                        min_value=0.00,
                        step=100.00,
                        format="%.2f",
                        key=f"{categoria}_monto_{idx}",
                        label_visibility="collapsed"
                    )
                
                with col3:
                    incluir = st.checkbox(
                        "Incluir",
                        value=row['Incluir'],
                        key=f"{categoria}_incluir_{idx}",
                        label_visibility="collapsed"
                    )
                
                with col4:
                    eliminar = st.checkbox(
                        "Eliminar",
                        value=False,
                        key=f"{categoria}_borrar_{idx}",
                        label_visibility="collapsed"
                    )
                
                cambios.append({
                    'Categoria': categoria,
                    'Nombre_Cuenta': nombre,
                    'Monto_Objetivo': monto,
                    'Incluir': incluir,
                    'eliminar': eliminar,
                    'Ultimo_Valor': row.get('Ultimo_Valor', 0.0)
                })
            
            st.divider()
            
            # Agregar nueva cuenta
            st.write("**Agregar Nueva Cuenta**")
            col1, col2, col3 = st.columns([3, 2, 1])
            
            with col1:
                nueva_cuenta = st.text_input(
                    "Nombre de nueva cuenta",
                    key=f"{categoria}_nueva",
                    label_visibility="collapsed",
                    placeholder="Nombre de la cuenta"
                )
            
            with col2:
                nuevo_monto = st.number_input(
                    "Monto inicial",
                    value=0.00,
                    min_value=0.00,
                    step=100.00,
                    format="%.2f",
                    key=f"{categoria}_nuevo_monto",
                    label_visibility="collapsed"
                )
            
            with col3:
                st.write("")
            
            # Botones de acción
            col_guardar, col_espacio = st.columns([1, 1])
            
            with col_guardar:
                guardar = st.form_submit_button("💾 Guardar Cambios", use_container_width=True)
            
            if guardar:
                # Procesar cambios
                nuevas_filas = []
                
                for cambio in cambios:
                    if not cambio['eliminar']:
                        nuevas_filas.append({
                            'Categoria': cambio['Categoria'],
                            'Nombre_Cuenta': cambio['Nombre_Cuenta'],
                            'Monto_Objetivo': cambio['Monto_Objetivo'],
                            'Incluir': cambio['Incluir'],
                            'Ultimo_Valor': cambio['Ultimo_Valor']
                        })
                
                # Agregar nueva cuenta si se especificó
                if nueva_cuenta.strip():
                    nuevas_filas.append({
                        'Categoria': categoria,
                        'Nombre_Cuenta': nueva_cuenta.strip(),
                        'Monto_Objetivo': nuevo_monto,
                        'Incluir': True,
                        'Ultimo_Valor': 0.0
                    })
                
                # Reconstruir el dataframe completo
                df_otras_categorias = df_cuentas[df_cuentas['Categoria'] != categoria]
                df_actualizado = pd.concat([
                    df_otras_categorias,
                    pd.DataFrame(nuevas_filas)
                ], ignore_index=True)
                
                # Guardar
                save_cuentas(df_actualizado)
                st.success(f"✅ Cambios guardados en {categoria}")
                st.rerun()



####################################################################
# --- RESUMEN ---
st.divider()
st.subheader("📊 Resumen de Configuración Actual")

df_cuentas = load_cuentas()

# Crear tabla de resumen
resumen_data = []
for categoria in categorias:
    df_cat = df_cuentas[df_cuentas['Categoria'] == categoria]
    cuentas_activas = df_cat[df_cat['Incluir']].shape[0]
    total_objetivo = df_cat[df_cat['Incluir']]['Monto_Objetivo'].sum()
    
    resumen_data.append({
        'Categoría': categoria,
        'Cuentas Activas': cuentas_activas,
        'Monto Total Objetivo': f"${total_objetivo:,.2f}"
    })

df_resumen = pd.DataFrame(resumen_data)
st.table(df_resumen)

# Mostrar detalles por categoría
st.subheader("📋 Detalle de Cuentas Activas")

for categoria in categorias:
    df_cat = df_cuentas[df_cuentas['Categoria'] == categoria]
    df_cat_activas = df_cat[df_cat['Incluir']]
    
    if len(df_cat_activas) > 0:
        with st.expander(f"{categoria} ({len(df_cat_activas)} cuentas activas)"):
            df_mostrar = df_cat_activas[['Nombre_Cuenta', 'Monto_Objetivo']].copy()
            df_mostrar.columns = ['Nombre', 'Monto Objetivo']
            df_mostrar['Monto Objetivo'] = df_mostrar['Monto Objetivo'].apply(lambda x: f"${x:,.2f}")
            st.dataframe(df_mostrar, use_container_width=True, hide_index=True)
