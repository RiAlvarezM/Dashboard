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
st.set_page_config(page_title="Gestor de Cuentas", layout="wide")

AUTOS = [
    {"nombre": "Civic", "valor": 30000.00, "fecha": date(2018, 12, 1)},
    {"nombre": "CRV", "valor": 17500.00, "fecha": date(2013, 1, 1)},
]

PROPIEDADES = [
    {"nombre": "Park Avenue", "valor": 224900.00, "fecha": date(2018, 12, 1)},
    {"nombre": "4 Islas", "valor": 120000.00, "fecha": date(2016, 5, 1)},
]

####################################################################
# --- FUNCIONES ---

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

if "data_totals" not in st.session_state:
    st.session_state.data_totals = load_db_totals()

data = st.session_state.data_totals

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
# AHORROS
with st.expander("💰 Ahorros", expanded=True):
    col1, col2, col3 = st.columns(3)
    with col1:
        edioacc_ra = st.number_input(label="EDIOACC-Ricardo", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_1")
        edioacc_graciela = st.number_input(label="EDIOACC-Graciela", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_2")
        bgeneral_flia = st.number_input(label="BGeneral-Flia", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_3")
    with col2:    
        bgeneral_graciela = st.number_input(label="BGeneral-Graciela", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_4")
        global_flia = st.number_input(label="Global-Flia", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_5")
        banistmo = st.number_input(label="Banistmo", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_6")
    with col3:    
        bac_ahorro = st.number_input(label="BAC-Ahorro", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_7")
        global_online_gg = st.number_input(label="Global-OnlineGG", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_8")
        schwab = st.number_input(label="Schwab", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="ahorro_9")

with st.expander("💼 Inversiones", expanded=True):
    col1, col2, col3 = st.columns(3)
    with col1:
        profuturo = st.number_input(label="Profuturo - R.A.", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_1")
        fortesza_ra = st.number_input(label="Fortesza RA", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_2")
        fortesza_gg = st.number_input(label="Fortesza GG", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_3")
    with col2:    
        paullier_online = st.number_input(label="Paullier Online", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_4")
        interactive_brokers = st.number_input(label="Interactive Brokers", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_5")
        criptos = st.number_input(label="Criptos", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_6")
    with col3:    
        bac_objetivo = st.number_input(label="BAC-Objetivo", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_7")
        charles_schwab = st.number_input(label="Charles Schwab", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_8")
        global_online_escuela = st.number_input(label="Global Online - Escuela", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="inversion_9")

with st.expander("👵🏼 Jubilación", expanded=False):
    col1, col2, col3 = st.columns(3)
    with col1:
        st.number_input(label="EDIOACC Plazo Fijo", min_value=0.00, value=20000.00, step=0.01,format="%0.2f", key="jubilacion_1")
        st.number_input(label="EDIOACC - Jubilación R.A.", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_2")
        st.number_input(label="EDIOACC - Jubilación G.G.", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_3")
    with col2:    
        st.number_input(label="EDIOACC - Aportes R.A.", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_4")
        st.number_input(label="EDIOACC - Aportes G.G.", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_5")
        st.number_input(label="EDIOACC - Hipoteca", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_6")
    with col3:    
        st.number_input(label="SIACAP", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_7")
        st.number_input(label="Copa - Fondo", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_8")
        st.number_input(label="Progreso", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="jubilacion_9")

col1, col2 = st.columns(2)
with col1:
    with st.expander("💳 Deuda", expanded=False):
        st.number_input(label="Global TC - Graciela", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="deuda_1")
        st.number_input(label="Global MC - Ricardo", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="deuda_2")
        st.number_input(label="BAC - Mastercard", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="deuda_3")
        st.number_input(label="BAC - Visa Smartcash", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="deuda_4")
with col2:
    with st.expander("💸 Préstamos", expanded=False):   
        st.number_input(label="4 Islas", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="prestamo_1")
        st.number_input(label="Park Avenue", min_value=0.00, value=0.00, step=0.01,format="%0.2f", key="prestamo_2")


st.subheader("📈 Totales a Registrar")
with st.container(border=True):
    # --- Recolectar y sumar los valores de los inputs en tiempo real ---
    total_ahorro_preview = sum(st.session_state.get(f"ahorro_{i}", 0) for i in range(1, 10))
    total_inversion_preview = sum(st.session_state.get(f"inversion_{i}", 0) for i in range(1, 10))
    total_jubilacion_preview = sum(st.session_state.get(f"jubilacion_{i}", 0) for i in range(1, 10))
    total_deuda_preview = sum(st.session_state.get(f"deuda_{i}", 0) for i in range(1, 5))
    total_prestamo_preview = sum(st.session_state.get(f"prestamo_{i}", 0) for i in range(1, 3))

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
    if st.button("💾 Guardar Registro", use_container_width=True, type="primary"):
        # --- Recolectar y sumar los valores de los inputs ---
        total_ahorro = sum(st.session_state[f"ahorro_{i}"] for i in range(1, 10))
        total_inversion = sum(st.session_state[f"inversion_{i}"] for i in range(1, 10))
        total_jubilacion = sum(st.session_state[f"jubilacion_{i}"] for i in range(1, 10))
        total_deuda = sum(st.session_state[f"deuda_{i}"] for i in range(1, 5))
        total_prestamo = sum(st.session_state[f"prestamo_{i}"] for i in range(1, 3))

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

        # --- Recargar y recalcular todos los datos ---
        st.session_state.data_totals = load_db_totals()
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
