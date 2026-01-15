####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import os
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from datetime import date
import numpy as np

####################################################################
# --- CONFIGURACIÓN ---
FILE_DB = 'networth_db.csv'
st.set_page_config(page_title="Proyector de Jubilación", layout="wide")

####################################################################
# --- FUNCIONES ---

def load_jubilacion_data():
    """Carga los datos de jubilación del histórico."""
    if not os.path.exists(FILE_DB):
        return pd.DataFrame()
    
    df = pd.read_csv(FILE_DB)
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    
    # Extraer año de la fecha
    df['Año'] = df['Fecha'].dt.year
    
    # Agrupar por año y tomar el último registro de cada año
    jubilacion_por_año = df.groupby('Año')['Jubilacion'].last().reset_index()
    jubilacion_por_año.columns = ['Año', 'Jubilacion']
    
    return jubilacion_por_año.sort_values('Año')

def calcular_aporte_necesario(
    jubilacion_actual: float,
    objetivo: float,
    aumento_anual_pct: float,
    edad_actual: int,
    edad_jubilacion: int = 65,
    ingreso_estado_mensual: float = 2500.0
):
    """
    Calcula el aporte mensual necesario para alcanzar el objetivo a los 65 años.
    Utiliza búsqueda binaria para encontrar el aporte exacto.
    """
    # Rango de búsqueda: desde 0 hasta 10,000 mensuales
    min_aporte = 0.0
    max_aporte = 10000.0
    tolerancia = 1.0  # Tolerancia de $1
    
    while max_aporte - min_aporte > 0.01:
        aporte_prueba = (min_aporte + max_aporte) / 2
        
        proy = calcular_proyeccion(
            jubilacion_actual=jubilacion_actual,
            aporte_mensual=aporte_prueba,
            aumento_anual_pct=aumento_anual_pct,
            edad_actual=edad_actual,
            edad_jubilacion=edad_jubilacion,
            ingreso_estado_mensual=ingreso_estado_mensual
        )
        
        saldo_resultado = proy[proy['Edad'] == edad_jubilacion]['Saldo'].values[0]
        
        if saldo_resultado < objetivo:
            min_aporte = aporte_prueba
        else:
            max_aporte = aporte_prueba
    
    return (min_aporte + max_aporte) / 2

def calcular_proyeccion(
    jubilacion_actual: float,
    aporte_mensual: float,
    aumento_anual_pct: float,
    edad_actual: int,
    edad_jubilacion: int = 65,
    ingreso_estado_mensual: float = 2500.0
):
    """
    Calcula la proyección de jubilación hasta los 65 años.
    
    Args:
        jubilacion_actual: Saldo actual de jubilación
        aporte_mensual: Aporte mensual esperado
        aumento_anual_pct: Aumento porcentual anual del aporte
        edad_actual: Edad actual
        edad_jubilacion: Edad de jubilación (default 65)
        ingreso_estado_mensual: Ingreso mensual del estado a los 65
    
    Returns:
        DataFrame con la proyección
    """
    proyeccion = []
    saldo = jubilacion_actual
    aporte_actual = aporte_mensual
    año_actual = date.today().year
    
    for i in range(edad_jubilacion - edad_actual + 1):
        edad = edad_actual + i
        año = año_actual + i
        
        if edad < edad_jubilacion:
            # Aportes hasta los 65
            aporte_anual = aporte_actual * 12
            saldo += aporte_anual
            
            proyeccion.append({
                'Año': año,
                'Edad': edad,
                'Aporte_Mensual': aporte_actual,
                'Aporte_Anual': aporte_anual,
                'Saldo': saldo,
                'Ingreso_Mensual_Estado': 0
            })
            
            # Aumentar el aporte para el próximo año
            aporte_actual = aporte_actual * (1 + aumento_anual_pct / 100)
        else:
            # A los 65, agrega el ingreso del estado y para de aportar
            ingreso_anual_estado = ingreso_estado_mensual * 12
            saldo += ingreso_anual_estado
            
            proyeccion.append({
                'Año': año,
                'Edad': edad,
                'Aporte_Mensual': 0,
                'Aporte_Anual': 0,
                'Saldo': saldo,
                'Ingreso_Mensual_Estado': ingreso_estado_mensual
            })
    
    return pd.DataFrame(proyeccion)

####################################################################
# --- INTERFAZ ---
st.title("🎯 Proyector de Jubilación")

# Cargar datos históricos
jubilacion_historica = load_jubilacion_data()

if jubilacion_historica.empty:
    st.warning("⚠️ No hay datos de jubilación en el histórico. Por favor carga datos primero en la página de Inicio.")
else:
    # Obtener el último valor de jubilación
    jubilacion_ultima = jubilacion_historica['Jubilacion'].iloc[-1]
    año_ultima = jubilacion_historica['Año'].iloc[-1]
    
    # Sidebar con parámetros
    st.sidebar.header("⚙️ Parámetros de Proyección")
    
    with st.sidebar:
        # Calcular edad automáticamente desde el año de nacimiento
        año_nacimiento = st.number_input(
            "Año de nacimiento",
            min_value=1950,
            max_value=2007,
            value=1989,
            step=1
        )
        edad_actual = date.today().year - año_nacimiento
        st.info(f"📅 Tu edad actual: **{edad_actual} años**")
        
        col_edad_jub = st.columns(1)[0]
        edad_jubilacion = st.number_input(
            "Edad de jubilación",
            min_value=edad_actual + 1,
            max_value=75,
            value=65,
            step=1
        )
        
        st.divider()
        
        objetivo_jubilacion = st.number_input(
            "Objetivo de saldo a los 65 ($)",
            min_value=100000.0,
            value=500000.0,
            step=50000.0,
            format="%.2f"
        )
        
        st.divider()
        
        aporte_mensual = st.number_input(
            "Aporte mensual esperado ($)",
            min_value=0.0,
            value=500.0,
            step=50.0,
            format="%.2f"
        )
        
        aumento_anual = st.number_input(
            "Aumento anual de aportes (%)",
            min_value=0.0,
            max_value=20.0,
            value=3.0,
            step=0.5,
            format="%.1f"
        )
        
        st.divider()
        
        ingreso_estado = st.number_input(
            "Ingreso mensual del estado a los 65 ($)",
            min_value=0.0,
            value=2500.0,
            step=100.0,
            format="%.2f"
        )
    
    # Calcular proyección
    proyeccion = calcular_proyeccion(
        jubilacion_actual=jubilacion_ultima,
        aporte_mensual=aporte_mensual,
        aumento_anual_pct=aumento_anual,
        edad_actual=edad_actual,
        edad_jubilacion=edad_jubilacion,
        ingreso_estado_mensual=ingreso_estado
    )
    
    # --- ESTADÍSTICAS PRINCIPALES ---
    st.subheader("📊 Resumen de la Proyección")
    
    saldo_a_65 = proyeccion[proyeccion['Edad'] == edad_jubilacion]['Saldo'].values[0]
    años_para_jubilar = edad_jubilacion - edad_actual
    aporte_total = proyeccion[proyeccion['Edad'] < edad_jubilacion]['Aporte_Anual'].sum()
    
    # Calcular aporte necesario para el objetivo
    aporte_necesario = calcular_aporte_necesario(
        jubilacion_actual=jubilacion_ultima,
        objetivo=objetivo_jubilacion,
        aumento_anual_pct=aumento_anual,
        edad_actual=edad_actual,
        edad_jubilacion=edad_jubilacion,
        ingreso_estado_mensual=ingreso_estado
    )
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(
            "Saldo Actual",
            f"${jubilacion_ultima:,.2f}",
            f"al {año_ultima}"
        )
    with col2:
        diferencia = saldo_a_65 - objetivo_jubilacion
        diferencia_color = "🔴" if diferencia < 0 else "🟢"
        st.metric(
            "Saldo Proyectado a 65",
            f"${saldo_a_65:,.2f}",
            f"{diferencia_color} {diferencia:,.2f}"
        )
    with col3:
        st.metric(
            "Objetivo a 65",
            f"${objetivo_jubilacion:,.2f}",
            f"Aporte needed: ${aporte_necesario:,.2f}"
        )
    with col4:
        ingreso_anual_65 = ingreso_estado * 12
        st.metric(
            "Ingreso Anual a los 65",
            f"${ingreso_anual_65:,.2f}",
            "del estado + ahorros"
        )
    
    st.divider()
    
    # --- GRÁFICO DE PROYECCIÓN: IDEAL vs REAL ---
    st.subheader("📈 Path Ideal vs Path Real")
    
    # Calcular proyección ideal (para alcanzar el objetivo)
    proyeccion_ideal = calcular_proyeccion(
        jubilacion_actual=jubilacion_ultima,
        aporte_mensual=aporte_necesario,
        aumento_anual_pct=aumento_anual,
        edad_actual=edad_actual,
        edad_jubilacion=edad_jubilacion,
        ingreso_estado_mensual=ingreso_estado
    )
    
    # Combinar datos históricos con proyecciones
    df_historico = jubilacion_historica.rename(columns={'Año': 'Año', 'Jubilacion': 'Saldo'})
    df_historico['Tipo'] = 'Histórico'
    
    df_real = proyeccion[['Año', 'Saldo']].copy()
    df_real['Tipo'] = 'Real (Actual)'
    
    df_ideal = proyeccion_ideal[['Año', 'Saldo']].copy()
    df_ideal['Tipo'] = 'Ideal (Objetivo)'
    
    # Combinar, evitando duplicados
    df_combinado = pd.concat([
        df_historico, 
        df_real[df_real['Año'] > df_historico['Año'].max()],
        df_ideal[df_ideal['Año'] > df_historico['Año'].max()]
    ])
    
    # Filtrar para mostrar solo desde enero 2025 (o primer dato disponible)
    primer_año_historico = df_historico['Año'].min()
    df_combinado = df_combinado[df_combinado['Año'] >= primer_año_historico]
    
    fig = go.Figure()
    
    # Datos históricos
    df_hist = df_combinado[df_combinado['Tipo'] == 'Histórico']
    if not df_hist.empty:
        fig.add_trace(go.Scatter(
            x=df_hist['Año'],
            y=df_hist['Saldo'],
            mode='lines+markers',
            name='Histórico',
            line=dict(color='#1f77b4', width=3),
            marker=dict(size=8)
        ))
    
    # Path Real
    df_real_plot = df_combinado[df_combinado['Tipo'] == 'Real (Actual)']
    if not df_real_plot.empty:
        fig.add_trace(go.Scatter(
            x=df_real_plot['Año'],
            y=df_real_plot['Saldo'],
            mode='lines+markers',
            name='Path Real (Actual)',
            line=dict(color='#ff7f0e', width=3, dash='dash'),
            marker=dict(size=8)
        ))
    
    # Path Ideal
    df_ideal_plot = df_combinado[df_combinado['Tipo'] == 'Ideal (Objetivo)']
    if not df_ideal_plot.empty:
        fig.add_trace(go.Scatter(
            x=df_ideal_plot['Año'],
            y=df_ideal_plot['Saldo'],
            mode='lines+markers',
            name='Path Ideal (Objetivo)',
            line=dict(color='#2ca02c', width=3),
            marker=dict(size=8)
        ))
    
    # Línea de jubilación
    año_jubilacion = date.today().year + (edad_jubilacion - edad_actual)
    fig.add_vline(
        x=año_jubilacion,
        line_dash="dash",
        line_color="red",
        annotation_text="Jubilación (65 años)",
        annotation_position="top right"
    )
    
    # Línea de objetivo
    fig.add_hline(
        y=objetivo_jubilacion,
        line_dash="dot",
        line_color="green",
        annotation_text=f"Objetivo: ${objetivo_jubilacion:,.0f}",
        annotation_position="right"
    )
    
    fig.update_layout(
        title="Evolución del Saldo de Jubilación: Ideal vs Real",
        xaxis_title="Año",
        yaxis_title="Saldo ($)",
        hovermode='x unified',
        height=600,
        template='plotly_white',
        yaxis=dict(tickformat='$,.0f')
    )
    
    st.plotly_chart(fig, width='stretch')
    
    # Info sobre el aporte necesario
    col_info1, col_info2 = st.columns(2)
    with col_info1:
        st.info(f"""
        **Aporte Actual:** ${aporte_mensual:,.2f}/mes
        
        Llegará a: **${saldo_a_65:,.2f}** a los 65 años
        """)
    with col_info2:
        st.success(f"""
        **Aporte Necesario:** ${aporte_necesario:,.2f}/mes
        
        Para alcanzar: **${objetivo_jubilacion:,.2f}** a los 65 años
        """)
    
    st.divider()
    
    # --- TABLA DETALLADA ---
    st.subheader("📋 Detalle por Año")
    
    # Formatear la proyección para mostrar
    df_show = proyeccion.copy()
    df_show['Saldo'] = df_show['Saldo'].apply(lambda x: f"${x:,.2f}")
    df_show['Aporte_Mensual'] = df_show['Aporte_Mensual'].apply(lambda x: f"${x:,.2f}")
    df_show['Aporte_Anual'] = df_show['Aporte_Anual'].apply(lambda x: f"${x:,.2f}")
    df_show['Ingreso_Mensual_Estado'] = df_show['Ingreso_Mensual_Estado'].apply(lambda x: f"${x:,.2f}")
    
    df_show = df_show.rename(columns={
        'Año': 'Año',
        'Edad': 'Edad',
        'Aporte_Mensual': 'Aporte Mensual',
        'Aporte_Anual': 'Aporte Anual',
        'Saldo': 'Saldo Total',
        'Ingreso_Mensual_Estado': 'Ingreso Estado'
    })
    
    st.dataframe(df_show, use_container_width=True, hide_index=True)
    
    st.divider()
    
    # --- ANÁLISIS DE SENSIBILIDAD ---
    st.subheader("📊 Análisis de Sensibilidad")
    st.caption("Cómo cambia el saldo a los 65 años según diferentes variables")
    
    col_sens1, col_sens2 = st.columns(2)
    
    with col_sens1:
        st.write("**Variación por Aporte Mensual**")
        aportes_test = [aporte_mensual * 0.5, aporte_mensual, aporte_mensual * 1.5]
        results_aporte = []
        
        for ap in aportes_test:
            proy_test = calcular_proyeccion(
                jubilacion_actual=jubilacion_ultima,
                aporte_mensual=ap,
                aumento_anual_pct=aumento_anual,
                edad_actual=edad_actual,
                edad_jubilacion=edad_jubilacion,
                ingreso_estado_mensual=ingreso_estado
            )
            saldo_test = proy_test[proy_test['Edad'] == edad_jubilacion]['Saldo'].values[0]
            results_aporte.append({'Aporte Mensual': f"${ap:,.2f}", 'Saldo a 65': f"${saldo_test:,.2f}"})
        
        df_aporte = pd.DataFrame(results_aporte)
        st.dataframe(df_aporte, use_container_width=True, hide_index=True)
    
    with col_sens2:
        st.write("**Variación por Aumento Anual**")
        aumentos_test = [aumento_anual * 0.5, aumento_anual, aumento_anual * 1.5]
        results_aumento = []
        
        for aum in aumentos_test:
            proy_test = calcular_proyeccion(
                jubilacion_actual=jubilacion_ultima,
                aporte_mensual=aporte_mensual,
                aumento_anual_pct=aum,
                edad_actual=edad_actual,
                edad_jubilacion=edad_jubilacion,
                ingreso_estado_mensual=ingreso_estado
            )
            saldo_test = proy_test[proy_test['Edad'] == edad_jubilacion]['Saldo'].values[0]
            results_aumento.append({'Aumento Anual': f"{aum:.1f}%", 'Saldo a 65': f"${saldo_test:,.2f}"})
        
        df_aumento = pd.DataFrame(results_aumento)
        st.dataframe(df_aumento, use_container_width=True, hide_index=True)
