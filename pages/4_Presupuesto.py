####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import os
import json
import streamlit as st
import pandas as pd

####################################################################
# --- CONFIGURACIÓN ---
FILE_PRESUPUESTO = 'presupuesto.json'
st.set_page_config(page_title="Presupuesto Mensual", layout="wide")

####################################################################
# --- FUNCIONES ---

def load_presupuesto():
    """Carga el presupuesto desde el archivo JSON."""
    if not os.path.exists(FILE_PRESUPUESTO):
        presupuesto_inicial = {
            "gastos": {
                "Impuestos": 1997.10,
                "Hipoteca 4 Islas": 572.41,
                "Hipoteca Park Ave": 778.00,
                "Mantenimiento 4 Islas": 222.38,
                "Mantenimiento Park Ave": 253.81,
                "Mantenimiento Bahia": 316.80,
                "Agua 4 Islas": 0.00,
                "Agua Park Ave": 9.67,
                "Agua Bahia": 18.22,
                "Supermercado": 900.00,
                "Gasolina": 150.00,
                "Electricidad": 100.00,
                "Telefono Movil": 100.06,
                "Internet": 30.44,
                "Restaurantes": 200.00,
                "Comida - Trabajo": 100.00,
                "Corredor": 25.00,
                "Lucy": 525.00,
                "Seguros Tarjetas": 75.00,
                "Seguros Vida": 45.58,
                "Seguro Salud Niños": 149.63,
                "Seguro Civic": 50.83,
                "Seguro CRV": 49.19,
                "Spotify": 9.99,
                "iCloud": 9.99,
                "Natación Andres": 50.00,
                "Moka": 75.00,
                "Padel": 20.00,
                "Estacionamiento": 20.00,
                "Regalos": 25.00,
                "Compras de la casa": 100.00,
                "Compras Privadas": 200.00,
                "Netflix": 4.99,
                "Kindle": 21.40,
                "Mallas 1": 33.30,
                "Mallas 2": 33.30,
                "Ms Blok": 400.00
            },
            "ingresos": {
                "ACP": 5692.80,
                "Copa": 2600.63,
                "Plazo Fijo": 83.00,
                "Pluxee": 57.63,
                "Cashback": 20.00,
                "Smartcash": 30.00,
                "Alquiler": 640.00
            },
            "inversiones": {
                "Aportes EDIOACC": 60.00,
                "Jubilación EDIOACC": 270.00,
                "Jubilación Profuturo": 100.00,
                "Objetivo BAC": 92.00,
                "Ahorro Copa": 30.00
            }
        }
        save_presupuesto(presupuesto_inicial)
        return presupuesto_inicial
    
    with open(FILE_PRESUPUESTO, 'r') as f:
        return json.load(f)

def save_presupuesto(presupuesto):
    """Guarda el presupuesto en el archivo JSON."""
    with open(FILE_PRESUPUESTO, 'w') as f:
        json.dump(presupuesto, f, indent=2)

####################################################################
# --- INTERFAZ ---
st.title("💰 Presupuesto Mensual")

# Cargar presupuesto
presupuesto = load_presupuesto()

# Calcular totales
total_ingresos = sum(presupuesto["ingresos"].values())
total_gastos = sum(presupuesto["gastos"].values())
total_inversiones = sum(presupuesto["inversiones"].values())
balance = total_ingresos - total_gastos - total_inversiones

# --- RESUMEN ---
st.subheader("📊 Resumen Mensual")

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("💵 Ingresos", f"B/. {total_ingresos:,.2f}")
with col2:
    st.metric("💸 Gastos", f"B/. {total_gastos:,.2f}")
with col3:
    st.metric("📈 Inversiones", f"B/. {total_inversiones:,.2f}")
with col4:
    balance_emoji = "🟢" if balance >= 0 else "🔴"
    st.metric("💰 Balance", f"B/. {balance:,.2f}", delta=f"{balance_emoji}")

st.divider()

# --- TABS ---
tab1, tab2, tab3, tab4 = st.tabs(["💸 Gastos", "💵 Ingresos", "📈 Inversiones", "➕ Agregar"])

# --- TAB GASTOS ---
with tab1:
    st.subheader("Gastos Mensuales")
    
    # Convertir a DataFrame para edición
    df_gastos = pd.DataFrame(list(presupuesto["gastos"].items()), columns=["Categoría", "Monto"])
    df_gastos["Eliminar"] = False
    
    edited_gastos = st.data_editor(
        df_gastos,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Categoría": st.column_config.TextColumn("Categoría", width="large"),
            "Monto": st.column_config.NumberColumn(
                "Monto (B/.)",
                format="B/. %.2f",
                min_value=0.0
            ),
            "Eliminar": st.column_config.CheckboxColumn("🗑️ Eliminar")
        },
        num_rows="fixed"
    )
    
    col_save, col_delete = st.columns(2)
    
    with col_save:
        if st.button("💾 Guardar Cambios en Gastos", use_container_width=True):
            # Actualizar presupuesto con cambios
            presupuesto["gastos"] = dict(zip(
                edited_gastos[~edited_gastos["Eliminar"]]["Categoría"],
                edited_gastos[~edited_gastos["Eliminar"]]["Monto"]
            ))
            save_presupuesto(presupuesto)
            st.success("✅ Gastos actualizados")
            st.rerun()
    
    with col_delete:
        items_a_eliminar = edited_gastos[edited_gastos["Eliminar"]]
        if not items_a_eliminar.empty:
            if st.button("🗑️ Eliminar Seleccionados", use_container_width=True):
                presupuesto["gastos"] = dict(zip(
                    edited_gastos[~edited_gastos["Eliminar"]]["Categoría"],
                    edited_gastos[~edited_gastos["Eliminar"]]["Monto"]
                ))
                save_presupuesto(presupuesto)
                st.success(f"✅ {len(items_a_eliminar)} item(s) eliminado(s)")
                st.rerun()
    
    st.divider()
    st.metric("Total Gastos", f"B/. {sum(edited_gastos[~edited_gastos['Eliminar']]['Monto']):,.2f}")

# --- TAB INGRESOS ---
with tab2:
    st.subheader("Ingresos Mensuales")
    
    # Convertir a DataFrame para edición
    df_ingresos = pd.DataFrame(list(presupuesto["ingresos"].items()), columns=["Categoría", "Monto"])
    df_ingresos["Eliminar"] = False
    
    edited_ingresos = st.data_editor(
        df_ingresos,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Categoría": st.column_config.TextColumn("Categoría", width="large"),
            "Monto": st.column_config.NumberColumn(
                "Monto (B/.)",
                format="B/. %.2f",
                min_value=0.0
            ),
            "Eliminar": st.column_config.CheckboxColumn("🗑️ Eliminar")
        },
        num_rows="fixed"
    )
    
    col_save, col_delete = st.columns(2)
    
    with col_save:
        if st.button("💾 Guardar Cambios en Ingresos", use_container_width=True):
            presupuesto["ingresos"] = dict(zip(
                edited_ingresos[~edited_ingresos["Eliminar"]]["Categoría"],
                edited_ingresos[~edited_ingresos["Eliminar"]]["Monto"]
            ))
            save_presupuesto(presupuesto)
            st.success("✅ Ingresos actualizados")
            st.rerun()
    
    with col_delete:
        items_a_eliminar = edited_ingresos[edited_ingresos["Eliminar"]]
        if not items_a_eliminar.empty:
            if st.button("🗑️ Eliminar Seleccionados ", use_container_width=True, key="delete_ingresos"):
                presupuesto["ingresos"] = dict(zip(
                    edited_ingresos[~edited_ingresos["Eliminar"]]["Categoría"],
                    edited_ingresos[~edited_ingresos["Eliminar"]]["Monto"]
                ))
                save_presupuesto(presupuesto)
                st.success(f"✅ {len(items_a_eliminar)} item(s) eliminado(s)")
                st.rerun()
    
    st.divider()
    st.metric("Total Ingresos", f"B/. {sum(edited_ingresos[~edited_ingresos['Eliminar']]['Monto']):,.2f}")

# --- TAB INVERSIONES ---
with tab3:
    st.subheader("Inversiones Mensuales")
    
    # Convertir a DataFrame para edición
    df_inversiones = pd.DataFrame(list(presupuesto["inversiones"].items()), columns=["Categoría", "Monto"])
    df_inversiones["Eliminar"] = False
    
    edited_inversiones = st.data_editor(
        df_inversiones,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Categoría": st.column_config.TextColumn("Categoría", width="large"),
            "Monto": st.column_config.NumberColumn(
                "Monto (B/.)",
                format="B/. %.2f",
                min_value=0.0
            ),
            "Eliminar": st.column_config.CheckboxColumn("🗑️ Eliminar")
        },
        num_rows="fixed"
    )
    
    col_save, col_delete = st.columns(2)
    
    with col_save:
        if st.button("💾 Guardar Cambios en Inversiones", use_container_width=True):
            presupuesto["inversiones"] = dict(zip(
                edited_inversiones[~edited_inversiones["Eliminar"]]["Categoría"],
                edited_inversiones[~edited_inversiones["Eliminar"]]["Monto"]
            ))
            save_presupuesto(presupuesto)
            st.success("✅ Inversiones actualizadas")
            st.rerun()
    
    with col_delete:
        items_a_eliminar = edited_inversiones[edited_inversiones["Eliminar"]]
        if not items_a_eliminar.empty:
            if st.button("🗑️ Eliminar Seleccionados  ", use_container_width=True, key="delete_inversiones"):
                presupuesto["inversiones"] = dict(zip(
                    edited_inversiones[~edited_inversiones["Eliminar"]]["Categoría"],
                    edited_inversiones[~edited_inversiones["Eliminar"]]["Monto"]
                ))
                save_presupuesto(presupuesto)
                st.success(f"✅ {len(items_a_eliminar)} item(s) eliminado(s)")
                st.rerun()
    
    st.divider()
    st.metric("Total Inversiones", f"B/. {sum(edited_inversiones[~edited_inversiones['Eliminar']]['Monto']):,.2f}")

# --- TAB AGREGAR ---
with tab4:
    st.subheader("➕ Agregar Nueva Categoría")
    
    tipo_categoria = st.selectbox(
        "Tipo de categoría",
        options=["Gasto", "Ingreso", "Inversión"]
    )
    
    col_cat, col_monto = st.columns(2)
    
    with col_cat:
        nueva_categoria = st.text_input("Nombre de la categoría")
    
    with col_monto:
        nuevo_monto = st.number_input("Monto (B/.)", min_value=0.0, value=0.0, step=10.0, format="%.2f")
    
    if st.button("✅ Agregar Categoría", use_container_width=True):
        if nueva_categoria.strip():
            if tipo_categoria == "Gasto":
                presupuesto["gastos"][nueva_categoria] = nuevo_monto
            elif tipo_categoria == "Ingreso":
                presupuesto["ingresos"][nueva_categoria] = nuevo_monto
            else:  # Inversión
                presupuesto["inversiones"][nueva_categoria] = nuevo_monto
            
            save_presupuesto(presupuesto)
            st.success(f"✅ {tipo_categoria} '{nueva_categoria}' agregado exitosamente")
            st.rerun()
        else:
            st.error("⚠️ Por favor ingresa un nombre de categoría")

st.divider()

# --- GRÁFICO DE DISTRIBUCIÓN ---
st.subheader("📊 Distribución de Presupuesto")

col_chart1, col_chart2 = st.columns(2)

with col_chart1:
    st.write("**Top 10 Gastos**")
    gastos_sorted = dict(sorted(presupuesto["gastos"].items(), key=lambda x: x[1], reverse=True)[:10])
    st.bar_chart(gastos_sorted)

with col_chart2:
    st.write("**Distribución General**")
    distribucion = {
        "Gastos": total_gastos,
        "Inversiones": total_inversiones,
        "Disponible": max(0, balance)
    }
    st.bar_chart(distribucion)
