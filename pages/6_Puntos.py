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

FILE_PUNTOS = 'puntos_db.csv'
st.set_page_config(page_title="Puntos de Fidelidad", layout="wide")

####################################################################
# --- FUNCIONES ---

def load_puntos_db():
    """Cargar la base de datos de puntos desde CSV"""
    if not os.path.exists(FILE_PUNTOS):
        return pd.DataFrame(columns=[
            'Fecha', 
            'Global_TC_GG', 'Global_MC_RA', 'BAC_Visa',
            'Copa_RA', 'Copa_GG', 'Marriott'
        ])
    df = pd.read_csv(FILE_PUNTOS)
    df['Fecha'] = pd.to_datetime(df['Fecha'])
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
        label="",
        value=is_locked,
        key=lock_key,
    )
    return value

# Inicializar session state
if "data_puntos" not in st.session_state:
    st.session_state.data_puntos = load_puntos_db()

data = st.session_state.data_puntos

####################################################################
# --- INTERFACE DE USUARIO  ---
st.title("💳 Gestor de Puntos de Fidelidad")

st.subheader("📊 Resumen de Puntos Actuales")

# Mostrar totales actuales si hay datos
if not data.empty:
    ultimo_registro = data.iloc[0]  # El más reciente
    with st.container(border=True):
        col1, col2, col3 = st.columns(3)
        
        total_tc = (
            ultimo_registro.get('Global_TC_GG', 0) + 
            ultimo_registro.get('Global_MC_RA', 0) + 
            ultimo_registro.get('BAC_Visa', 0)
        )
        
        total_millas = (
            ultimo_registro.get('Copa_RA', 0) + 
            ultimo_registro.get('Copa_GG', 0)
        )
        
        with col1:
            st.metric("💳 Total Tarjetas", f"{total_tc:,.0f}")
        with col2:
            st.metric("✈️ Total Millas Copa", f"{total_millas:,.0f}")
        with col3:
            st.metric("🏨 Marriott Bonvoy", f"{ultimo_registro.get('Marriott', 0):,.0f}")

st.subheader("📝 Ingreso de Puntos")

with st.expander("💳 Tarjetas de Crédito", expanded=True):
    col1, col2, col3 = st.columns(3)
    with col1:
        global_tc_gg = locked_number_input(
            label="Global TC - Graciela", 
            min_value=0, 
            value=0, 
            step=100,
            format="%d", 
            key="puntos_global_tc_gg"
        )
    with col2:
        global_mc_ra = locked_number_input(
            label="Global MC - Ricardo", 
            min_value=0, 
            value=0, 
            step=100,
            format="%d", 
            key="puntos_global_mc_ra"
        )
    with col3:
        bac_visa = locked_number_input(
            label="BAC - Visa Smartcash", 
            min_value=0, 
            value=0, 
            step=100,
            format="%d", 
            key="puntos_bac_visa"
        )

with st.expander("✈️ Programas de Aerolíneas", expanded=True):
    col1, col2 = st.columns(2)
    with col1:
        copa_ra = locked_number_input(
            label="Copa ConnectMiles - Ricardo", 
            min_value=0, 
            value=0, 
            step=100,
            format="%d", 
            key="puntos_copa_ra"
        )
    with col2:
        copa_gg = locked_number_input(
            label="Copa ConnectMiles - Graciela", 
            min_value=0, 
            value=0, 
            step=100,
            format="%d", 
            key="puntos_copa_gg"
        )

with st.expander("🏨 Hoteles", expanded=True):
    marriott = locked_number_input(
        label="Marriott Bonvoy", 
        min_value=0, 
        value=0, 
        step=100,
        format="%d", 
        key="puntos_marriott"
    )

st.subheader("📈 Totales a Registrar")
with st.container(border=True):
    # --- Recolectar valores en tiempo real ---
    total_global_tc_gg_preview = st.session_state.get("puntos_global_tc_gg", 0)
    total_global_mc_ra_preview = st.session_state.get("puntos_global_mc_ra", 0)
    total_bac_visa_preview = st.session_state.get("puntos_bac_visa", 0)
    total_copa_ra_preview = st.session_state.get("puntos_copa_ra", 0)
    total_copa_gg_preview = st.session_state.get("puntos_copa_gg", 0)
    total_marriott_preview = st.session_state.get("puntos_marriott", 0)

    total_tarjetas = (total_global_tc_gg_preview + total_global_mc_ra_preview + 
                     total_bac_visa_preview)
    total_millas = total_copa_ra_preview + total_copa_gg_preview

    m_col1, m_col2, m_col3 = st.columns(3)
    m_col1.metric("💳 Tarjetas", f"{total_tarjetas:,.0f}")
    m_col2.metric("✈️ Copa", f"{total_millas:,.0f}")
    m_col3.metric("🏨 Marriott", f"{total_marriott_preview:,.0f}")

st.divider()

col_fecha, col_boton = st.columns([0.2, 0.8])
with col_fecha:
    fecha_registro = st.date_input("Fecha del Registro", value=date.today())

with col_boton:
    st.write("")
    st.write("")
    if st.button("💾 Guardar Registro", use_container_width=True, type="primary"):
        # --- Crear la nueva fila ---
        new_row = {
            'Fecha': pd.to_datetime(fecha_registro),
            'Global_TC_GG': st.session_state.get("puntos_global_tc_gg", 0),
            'Global_MC_RA': st.session_state.get("puntos_global_mc_ra", 0),
            'BAC_Visa': st.session_state.get("puntos_bac_visa", 0),
            'Copa_RA': st.session_state.get("puntos_copa_ra", 0),
            'Copa_GG': st.session_state.get("puntos_copa_gg", 0),
            'Marriott': st.session_state.get("puntos_marriott", 0),
        }

        # Convertir la nueva fila a un DataFrame
        new_df = pd.DataFrame([new_row])

        # --- Actualizar el DataFrame en session_state ---
        st.session_state.data_puntos = pd.concat([st.session_state.data_puntos, new_df], ignore_index=True)

        # --- Guardar el DataFrame actualizado en el CSV ---
        st.session_state.data_puntos.to_csv(FILE_PUNTOS, index=False)

        # --- Recargar datos ---
        st.session_state.data_puntos = load_puntos_db()
        st.success(f"✅ Registro para la fecha {fecha_registro.strftime('%Y-%m-%d')} guardado exitosamente.")
        st.rerun()

st.divider()
st.subheader("📋 Historial de Puntos")

if not data.empty:
    # Agregar columna para eliminar
    data['Eliminar'] = False

    # Mostrar tabla editable
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
            "Global_TC_GG": st.column_config.NumberColumn(
                "Global TC GG",
                format="%d pts"
            ),
            "Global_MC_RA": st.column_config.NumberColumn(
                "Global MC RA",
                format="%d pts"
            ),
            "BAC_Visa": st.column_config.NumberColumn(
                "BAC Visa",
                format="%d pts"
            ),
            "Copa_RA": st.column_config.NumberColumn(
                "Copa RA",
                format="%d mi"
            ),
            "Copa_GG": st.column_config.NumberColumn(
                "Copa GG",
                format="%d mi"
            ),
            "Marriott": st.column_config.NumberColumn(
                "Marriott",
                format="%d pts"
            ),
        },
        num_rows="fixed"
    )

    if st.button("🗑️ Eliminar Filas Seleccionadas", use_container_width=True):
        filas_a_eliminar = edited_df[edited_df['Eliminar']]
        
        if not filas_a_eliminar.empty:
            indices_a_eliminar = filas_a_eliminar.index
            
            # Eliminar las filas del DataFrame en session_state
            st.session_state.data_puntos.drop(indices_a_eliminar, inplace=True)
            
            # Guardar el DataFrame actualizado en el CSV
            st.session_state.data_puntos.to_csv(FILE_PUNTOS, index=False)
            
            st.success(f"✅ {len(indices_a_eliminar)} fila(s) eliminada(s) exitosamente.")
            st.rerun()
        else:
            st.warning("⚠️ No ha seleccionado ninguna fila para eliminar.")

    # --- GRÁFICOS ---
    st.divider()
    st.subheader("📊 Evolución de Puntos")

    # Preparar datos para gráficos (ordenar por fecha ascendente para los gráficos)
    data_sorted = data.sort_values('Fecha', ascending=True)

    # Gráfico de evolución de puntos de tarjetas
    fig_tarjetas = go.Figure()
    fig_tarjetas.add_trace(go.Scatter(
        x=data_sorted['Fecha'], 
        y=data_sorted['Global_TC_GG'],
        name='Global TC GG',
        mode='lines+markers'
    ))
    fig_tarjetas.add_trace(go.Scatter(
        x=data_sorted['Fecha'], 
        y=data_sorted['Global_MC_RA'],
        name='Global MC RA',
        mode='lines+markers'
    ))
    fig_tarjetas.add_trace(go.Scatter(
        x=data_sorted['Fecha'], 
        y=data_sorted['BAC_Visa'],
        name='BAC Visa',
        mode='lines+markers'
    ))
    
    fig_tarjetas.update_layout(
        title='Evolución de Puntos de Tarjetas de Crédito',
        xaxis_title='Fecha',
        yaxis_title='Puntos',
        hovermode='x unified'
    )
    st.plotly_chart(fig_tarjetas, use_container_width=True)

    # Gráfico de evolución de millas
    fig_millas = go.Figure()
    fig_millas.add_trace(go.Scatter(
        x=data_sorted['Fecha'], 
        y=data_sorted['Copa_RA'],
        name='Copa RA',
        mode='lines+markers',
        line=dict(color='#003594')
    ))
    fig_millas.add_trace(go.Scatter(
        x=data_sorted['Fecha'], 
        y=data_sorted['Copa_GG'],
        name='Copa GG',
        mode='lines+markers',
        line=dict(color='#D4AF37')
    ))
    
    fig_millas.update_layout(
        title='Evolución de Millas Copa ConnectMiles',
        xaxis_title='Fecha',
        yaxis_title='Millas',
        hovermode='x unified'
    )
    st.plotly_chart(fig_millas, use_container_width=True)

    # Gráfico de Marriott
    if data_sorted['Marriott'].sum() > 0:
        fig_marriott = go.Figure()
        fig_marriott.add_trace(go.Scatter(
            x=data_sorted['Fecha'], 
            y=data_sorted['Marriott'],
            name='Marriott Bonvoy',
            mode='lines+markers',
            line=dict(color='#8B0304')
        ))
        
        fig_marriott.update_layout(
            title='Evolución de Puntos Marriott Bonvoy',
            xaxis_title='Fecha',
            yaxis_title='Puntos',
            hovermode='x unified'
        )
        st.plotly_chart(fig_marriott, use_container_width=True)

else:
    st.info("👆 No hay registros aún. Ingresa los puntos arriba y guarda tu primer registro.")
