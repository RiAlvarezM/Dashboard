####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from datetime import datetime
from utils import *

####################################################################
# --- CONFIGURACIÓN ---
FILE_CUENTAS = 'cuentas.csv'
FILE_DB = 'networth_db.csv'
st.set_page_config(page_title="Gestor de Cuentas", layout="wide")


####################################################################
# --- FUNCIONES DE CARGA ---
def load_config():
    if not os.path.exists(FILE_CUENTAS):
        st.error(f"⚠️ No se encontró el archivo '{FILE_CUENTAS}'. Por favor créalo con la lista de cuentas.")
        return pd.DataFrame(columns=['Categoria', 'Nombre_Cuenta'])
    return pd.read_csv(FILE_CUENTAS)

def save_config(df):
    df.to_csv(FILE_CUENTAS, index=False)

def save_new_entry_ui(fecha, inputs_detalle, totales, autos):
    # 1. Guardar el detalle (Solo para referencia futura)
    rows = [{'Fecha': fecha, 'Nombre_Cuenta': k, 'Valor': v} for k, v in inputs_detalle.items()]
    df_detail = pd.DataFrame(rows)
    if not os.path.exists(FILE_TRANS):
        df_detail.to_csv(FILE_TRANS, index=False)
    else:
        df_detail.to_csv(FILE_TRANS, mode='a', header=False, index=False)

    # 2. Guardar el TOTAL en la DB Maestra
    row_total = {
        'Fecha': fecha,
        'Ahorro': totales['Ahorro'],
        'Inversion': totales['Inversion'],
        'Jubilacion': totales['Jubilacion'],
        'Deuda': totales['Deuda'],
        'Prestamo': totales['Prestamo'],
        'Propiedades': 0.0, # (O lógica de propiedades si la quieres)
        'Automoviles': autos
    }
    # Combinar con histórico existente
    df_new = pd.DataFrame([row_total])
    df_new['Fecha'] = pd.to_datetime(df_new['Fecha'])
    
    if os.path.exists(FILE_DB):
        df_old = pd.read_csv(FILE_DB)
        df_old['Fecha'] = pd.to_datetime(df_old['Fecha'])
        # Concatenar
        df_final = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df_final = df_new
        
    df_final.to_csv(FILE_DB, index=False)

def load_db_totals():
    if not os.path.exists(FILE_DB):
        return pd.DataFrame(columns=['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles'])
    df = pd.read_csv(FILE_DB)
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    
    # Calcular Patrimonio Total
    df['Total_Financiero'] = (df['Ahorro'] + df['Inversion'] + df['Jubilacion']) - df['Deuda']
    df['Patrimonio'] = df['Total_Financiero'] - df['Prestamo'] + df['Propiedades'] + df['Automoviles']
    return df.sort_values(by='Fecha', ascending=False)

####################################################################
# --- INTERFAZ ---
st.title("💰 Mi Gestor Financiero")

# 1. Cargar la configuración externa
df_cuentas = load_config()

# --- SIDEBAR: INPUT DINÁMICO ---
with st.sidebar:
    st.header("📝 Nuevo Cierre (Actual)")
    st.caption("Usa esto para agregar el mes corriente cuenta por cuenta.")
    
    f_fecha = st.date_input("Fecha", datetime.today())

    inputs_usuario = {}
    totales_cat = {c: 0.0 for c in ['Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']}
    
    with st.form("form_ui"):
        cats = ['Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
        for cat in cats:
            ctas = df_cuentas[df_cuentas['Categoria'] == cat]
            if not ctas.empty:
                with st.expander(f"{cat}", expanded=False):
                    for _, row in ctas.iterrows():
                        nm = row['Nombre_Cuenta']
                        # Input simple sin memoria para no complicar si no hay historial
                        val = st.number_input(nm, step=100.0, key=nm)
                        inputs_usuario[nm] = val
                        totales_cat[cat] += val
        
        st.markdown("---")
        f_autos = st.number_input("Valor Autos", step=500.0)
        
        if st.form_submit_button("💾 Guardar Cierre del Mes"):
            save_new_entry_ui(f_fecha, inputs_usuario, totales_cat, f_autos)
            st.success("Guardado y sumado al histórico.")
            st.rerun()

# --- TABS ---
tab1, tab2, tab3 = st.tabs(["📊 Dashboard", "📤 Cargar Histórico (Totales)", "⚙️ Configurar Cuentas UI"])