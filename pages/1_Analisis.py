import streamlit as st
import plotly.express as px

st.set_page_config(page_title="Análisis de Patrimonio", layout="wide")

st.title("📈 Análisis de Evolución del Patrimonio")

# --- Verificación de Datos ---
# Revisa si el DataFrame 'data_totals' existe en el estado de la sesión.
# Este es cargado en la página de Inicio.
if "data_totals" not in st.session_state or st.session_state.data_totals.empty:
    st.warning("No hay datos para analizar. Por favor, ve a la página de 'Inicio' para cargar o registrar datos.")
    st.page_link("Inicio.py", label="Ir a Inicio", icon="🏠")
    st.stop()

# --- Preparación de Datos ---
# Copiamos los datos para no modificar el estado original de la sesión
data_for_charts = st.session_state.data_totals.copy()

# Asegurarse de que la fecha está ordenada de forma ascendente para los gráficos
data_for_charts = data_for_charts.sort_values(by='Fecha', ascending=True)


# --- Gráfico 1: Préstamo vs. Patrimonio ---
st.subheader("Evolución del Patrimonio vs. Préstamos")

fig1 = px.line(
    data_for_charts,
    x='Fecha',
    y=['Patrimonio', 'Prestamo'],
    title='Comparación de Patrimonio y Préstamos a lo largo del tiempo',
    labels={'value': 'Monto ($)', 'variable': 'Métrica'},
    markers=True,
    template="plotly_white"
)
fig1.update_layout(yaxis_title='Monto ($)', legend_title_text='Métricas')
st.plotly_chart(fig1, use_container_width=True)

st.divider()

# --- Gráfico 2: Total, Disponible, Jubilación e Inversión ---
st.subheader("Composición de Activos y Disponibilidad")

fig2 = px.line(
    data_for_charts,
    x='Fecha',
    y=['Total', 'Disponible', 'Jubilacion', 'Inversion'],
    title='Evolución de Activos, Inversiones y Jubilación',
    labels={'value': 'Monto ($)', 'variable': 'Categoría'},
    markers=True,
    template="plotly_white"
)
fig2.update_layout(yaxis_title='Monto ($)', legend_title_text='Categorías')
st.plotly_chart(fig2, use_container_width=True)