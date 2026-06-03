####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import os

import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from datetime import date

####################################################################
# --- CONFIGURACIÓN ---

FILE_DB = 'networth_db.csv'
FILE_CUENTAS = 'cuentas.csv'
st.set_page_config(page_title="Gestor de Cuentas", layout="wide")

AUTOS = [
    {"nombre": "Civic", "valor": 30000.00, "fecha": date(2018, 12, 1)},
    {"nombre": "CRV", "valor": 17500.00, "fecha": date(2013, 1, 1)},
]

PROPIEDADES = [
    {"nombre": "Park Avenue", "valor": 224900.00, "fecha": date(2019, 1, 1)},
    {"nombre": "4 Islas", "valor": 120000.00, "fecha": date(2016, 5, 1)},
]

####################################################################
# --- FUNCIONES ---

def load_cuentas_config():
    """Carga la configuración de cuentas desde el archivo CSV."""
    if not os.path.exists(FILE_CUENTAS):
        return pd.DataFrame(columns=['Categoria', 'Nombre_Cuenta', 'Monto_Objetivo', 'Incluir', 'Ultimo_Valor'])
    df = pd.read_csv(FILE_CUENTAS)
    # Convertir columna Incluir a booleano
    df['Incluir'] = df['Incluir'].astype(str).str.lower() == 'true'
    df['Monto_Objetivo'] = pd.to_numeric(df['Monto_Objetivo'], errors='coerce').fillna(0.0)
    if 'Ultimo_Valor' not in df.columns:
        df['Ultimo_Valor'] = 0.0
    df['Ultimo_Valor'] = pd.to_numeric(df['Ultimo_Valor'], errors='coerce').fillna(0.0)
    return df

def get_cuentas_por_categoria(df_cuentas, categoria):
    """Obtiene las cuentas activas de una categoría."""
    return df_cuentas[(df_cuentas['Categoria'] == categoria) & (df_cuentas['Incluir'])].sort_values('Nombre_Cuenta')

def years_between(start_date, end_date=None):
    if end_date is None:
        end_date = date.today()
    return (end_date - start_date).days / 365.25

def depreciated_value(value, purchase_date, rate=0.20):
    years = years_between(purchase_date)
    return value * ((1 - rate) ** years)

def calcular_activos_fijos():
    autos_total = sum(
        depreciated_value(a["valor"], a["fecha"])
        for a in AUTOS
    )

    propiedades_total = sum(p["valor"] for p in PROPIEDADES)

    return autos_total, propiedades_total

def load_db_totals():
    if not os.path.exists(FILE_DB):
        return pd.DataFrame(columns=['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles'])
    df = pd.read_csv(FILE_DB)
    df['Fecha'] = pd.to_datetime(df['Fecha'])

    valores_auto_totales = []
    for row in df.itertuples():
        valor_total_autos = 0.0
        for auto in AUTOS:
            if auto['fecha'] <= row.Fecha.date():
                diferencia = row.Fecha.date() - auto['fecha']
                diferencia_anos = diferencia.total_seconds() / (365.25 * 24 * 3600)

                valor_depreciado = auto["valor"] * (0.8 ** diferencia_anos)
                valor_total_autos += valor_depreciado
        valores_auto_totales.append(valor_total_autos)

    valores_propiedades_totales = []
    for row in df.itertuples():
        valor_total_propiedades = 0.0
        for propiedad in PROPIEDADES:
            if propiedad['fecha'] <= row.Fecha.date():
                valor_total_propiedades += propiedad["valor"]
        valores_propiedades_totales.append(valor_total_propiedades)


    df['Automoviles'] = valores_auto_totales
    df['Propiedades'] = valores_propiedades_totales
    
    # Calcular Patrimonio Total
    df['Total'] = (df['Ahorro'] + df['Inversion'] + df['Jubilacion']) - df['Deuda']
    df['Disponible'] = df['Ahorro'] - df['Deuda']
    df['Patrimonio'] = df['Total'] - df['Prestamo'] + df['Propiedades'] + df['Automoviles']
    return df.sort_values(by='Fecha', ascending=False)

def locked_number_input(label, key, **kwargs):
    """Renderiza un number_input con un check para bloquearlo al marcarlo."""
    lock_key = f"{key}_lock"
    is_locked = st.session_state.get(lock_key, False)
    col_input, col_lock = st.columns([6, 1])
    value = col_input.number_input(
        label=label,
        key=key,
        disabled=is_locked,
        **kwargs,
    )
    col_lock.checkbox(
        label="Bloquear",
        value=is_locked,
        key=lock_key,
        label_visibility="collapsed"
    )
    return value

if "data_totals" not in st.session_state:
    st.session_state.data_totals = load_db_totals()

if "df_cuentas" not in st.session_state:
    st.session_state.df_cuentas = load_cuentas_config()

data = st.session_state.data_totals
df_cuentas = st.session_state.df_cuentas

####################################################################
# --- INTERFACE DE USUARIO  ---
st.title("📊 Ingreso de Valores de Cuentas")

# ACTIVOS
autos_total, propiedades_total = calcular_activos_fijos()

st.subheader("📊 Resumen General")

with st.container(border=True):
    st.subheader("🏠 Activos Fijos")
    metric1, metric2 = st.columns(2)
    with metric1:
        
        st.metric(
            label="🚗 Automóviles (valor actual)",
            value=f"${autos_total:,.2f}",
            help="Depreciación anual del 20%"
        )
    with metric2:
        st.metric(
                label="🏡 Propiedades",
                value=f"${propiedades_total:,.2f}",
                help="Sin depreciación"
            )

####################################################################
# --- FUNCIÓN PARA CREAR INPUTS DINÁMICOS ---

def crear_inputs_dinámicos(df_cuentas, categoria, emoji, expanded=True):
    """Crea inputs dinámicamente basados en la configuración de cuentas."""
    cuentas = get_cuentas_por_categoria(df_cuentas, categoria)
    
    if len(cuentas) == 0:
        with st.expander(f"{emoji} {categoria}", expanded=expanded):
            st.info(f"No hay cuentas activas configuradas para {categoria}. Ve a ⚙️ Configuración para agregar.")
        return [], []
    
    # Diccionario para almacenar los valores de esta categoría
    valores_categoria = []
    valores_por_cuenta = []
    
    with st.expander(f"{emoji} {categoria} ({len(cuentas)} cuentas)", expanded=expanded):
        # Mostrar resumen de objetivos
        total_objetivo = cuentas['Monto_Objetivo'].sum()
        if total_objetivo > 0:
            st.caption(f"📌 Monto objetivo total: ${total_objetivo:,.2f}")
        
        # Crear columnas para los inputs
        cols = st.columns(3)
        
        for idx, (real_idx, cuenta) in enumerate(cuentas.iterrows()):
            col = cols[idx % 3]
            
            with col:
                nombre_cuenta = cuenta['Nombre_Cuenta']
                monto_objetivo = float(cuenta['Monto_Objetivo'])
                ultimo_valor = float(cuenta.get('Ultimo_Valor', 0.0))
                key_name = f"{categoria}_{idx}"
                
                # Mostrar monto objetivo si existe
                if monto_objetivo > 0:
                    st.caption(f"🎯 ${monto_objetivo:,.2f}")
                
                valor = locked_number_input(
                    label=nombre_cuenta,
                    key=key_name,
                    min_value=0.00,
                    value=ultimo_valor,
                    step=0.01,
                    format="%0.2f"
                )
                
                valores_categoria.append(valor)
                valores_por_cuenta.append((real_idx, valor))
        
        # Mostrar total de esta categoría
        total_categoria = sum(valores_categoria)
        st.divider()
        col1, col2, col3 = st.columns(3)
        with col1:
            st.caption("")
        with col2:
            st.metric("Total " + categoria, f"${total_categoria:,.2f}")
        with col3:
            st.caption("")
    
    return valores_categoria, valores_por_cuenta

####################################################################
# --- GENERAR INPUTS POR CATEGORÍA ---

# Ahorros
valores_ahorro, cuentas_ahorro = crear_inputs_dinámicos(df_cuentas, 'Ahorro', '💰', expanded=True)

# Inversiones
valores_inversion, cuentas_inversion = crear_inputs_dinámicos(df_cuentas, 'Inversion', '💼', expanded=True)

# Jubilación
valores_jubilacion, cuentas_jubilacion = crear_inputs_dinámicos(df_cuentas, 'Jubilacion', '👵🏼', expanded=False)

# Deuda
valores_deuda, cuentas_deuda = crear_inputs_dinámicos(df_cuentas, 'Deuda', '💳', expanded=False)

# Préstamo
valores_prestamo, cuentas_prestamo = crear_inputs_dinámicos(df_cuentas, 'Prestamo', '💸', expanded=False)

st.subheader("📈 Totales a Registrar")
with st.container(border=True):
    # --- Recolectar y sumar los valores de los inputs en tiempo real ---
    total_ahorro_preview = sum(valores_ahorro)
    total_inversion_preview = sum(valores_inversion)
    total_jubilacion_preview = sum(valores_jubilacion)
    total_deuda_preview = sum(valores_deuda)
    total_prestamo_preview = sum(valores_prestamo)

    m_col1, m_col2, m_col3, m_col4, m_col5 = st.columns(5)
    m_col1.metric("Ahorro", f"${total_ahorro_preview:,.2f}")
    m_col2.metric("Inversión", f"${total_inversion_preview:,.2f}")
    m_col3.metric("Jubilación", f"${total_jubilacion_preview:,.2f}")
    m_col4.metric("Deuda", f"${total_deuda_preview:,.2f}")
    m_col5.metric("Préstamo", f"${total_prestamo_preview:,.2f}")


st.divider()

col_fecha, col_boton = st.columns([0.2, 0.8])
with col_fecha:
    fecha_registro = st.date_input("Fecha del Registro", value=date.today())

with col_boton:
    st.write("") # Espaciador
    st.write("") # Espaciador
    if st.button("💾 Guardar Registro", width="stretch", type="primary"):
        # --- Recolectar y sumar los valores de los inputs ---
        total_ahorro = sum(valores_ahorro)
        total_inversion = sum(valores_inversion)
        total_jubilacion = sum(valores_jubilacion)
        total_deuda = sum(valores_deuda)
        total_prestamo = sum(valores_prestamo)

        # --- Crear la nueva fila ---
        new_row = {
            'Fecha': pd.to_datetime(fecha_registro),
            'Ahorro': total_ahorro,
            'Inversion': total_inversion,
            'Jubilacion': total_jubilacion,
            'Deuda': total_deuda,
            'Prestamo': total_prestamo,
            'Propiedades': 0, # Se recalculará después
            'Automoviles': 0, # Se recalculará después
        }

        # Convertir la nueva fila a un DataFrame
        new_df = pd.DataFrame([new_row])

        # --- Actualizar el DataFrame en session_state ---
        # Usamos concat para añadir la nueva fila
        st.session_state.data_totals = pd.concat([st.session_state.data_totals, new_df], ignore_index=True)

        # --- Guardar el DataFrame actualizado en el CSV ---
        # Guardamos solo las columnas originales para no escribir las calculadas
        cols_to_save = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
        st.session_state.data_totals[cols_to_save].to_csv(FILE_DB, index=False)

        # --- Actualizar los últimos valores por cuenta ---
        todas_las_cuentas_actualizadas = cuentas_ahorro + cuentas_inversion + cuentas_jubilacion + cuentas_deuda + cuentas_prestamo
        for real_idx, valor in todas_las_cuentas_actualizadas:
            st.session_state.df_cuentas.loc[real_idx, 'Ultimo_Valor'] = valor
        
        st.session_state.df_cuentas.to_csv(FILE_CUENTAS, index=False)

        # --- Recargar y recalcular todos los datos ---
        st.session_state.data_totals = load_db_totals()
        st.session_state.df_cuentas = load_cuentas_config()
        st.success(f"✅ Registro para la fecha {fecha_registro.strftime('%Y-%m-%d')} guardado exitosamente.")
        st.rerun()


money_cols = [
    'Ahorro', 'Inversion', 'Jubilacion', 'Deuda',
    'Prestamo', 'Propiedades', 'Automoviles',
    'Total', 'Patrimonio'
]

# Asegurar tipos
data['Fecha'] = pd.to_datetime(data['Fecha'])

# Columnar para eliminar 
data['Eliminar'] = False

# Estilos
edited_df = st.data_editor(
    data,
    width="stretch",
    hide_index=True,
    column_config={
        "Eliminar": st.column_config.CheckboxColumn(
            "🗑️ Eliminar",
            help="Marca las filas que deseas eliminar"
        ),

        "Fecha": st.column_config.DateColumn(
            "Fecha",
            format="YYYY-MM-DD"
        ),

        "Ahorro": st.column_config.NumberColumn(
            "Ahorro",
            format="dollar"
        ),
        "Inversion": st.column_config.NumberColumn(
            "Inversión",
            format="dollar"
        ),
        "Jubilacion": st.column_config.NumberColumn(
            "Jubilación",
            format="dollar"
        ),
        "Deuda": st.column_config.NumberColumn(
            "Deuda",
            format="dollar"
        ),
        "Prestamo": st.column_config.NumberColumn(
            "Préstamo",
            format="dollar"
        ),
        "Propiedades": st.column_config.NumberColumn(
            "Propiedades",
            format="dollar"
        ),
        "Automoviles": st.column_config.NumberColumn(
            "Automóviles",
            format="dollar"
        ),
        "Disponible": st.column_config.NumberColumn(
            "Disponible",
            format="dollar"
        ),
        "Total": st.column_config.NumberColumn(
            "Total",
            format="dollar"
        ),
        "Patrimonio": st.column_config.NumberColumn(
            "Patrimonio",
            format="dollar"
        ),

    
    },
    num_rows="fixed"
)

if st.button("🗑️ Eliminar Filas Seleccionadas", use_container_width=True):
    filas_a_eliminar = edited_df[edited_df['Eliminar']]
    
    if not filas_a_eliminar.empty:
        indices_a_eliminar = filas_a_eliminar.index
        
        # Eliminar las filas del DataFrame en session_state
        st.session_state.data_totals.drop(indices_a_eliminar, inplace=True)
        
        # Guardar el DataFrame actualizado en el CSV
        cols_to_save = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
        st.session_state.data_totals[cols_to_save].to_csv(FILE_DB, index=False)
        
        st.success(f"✅ {len(indices_a_eliminar)} fila(s) eliminada(s) exitosamente.")
        st.rerun()
    else:
        st.warning("⚠️ No ha seleccionado ninguna fila para eliminar.")
