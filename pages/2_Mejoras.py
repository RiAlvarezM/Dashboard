####################################################################
# --- CONFIGURACIÓN DE LIBRERIAS ---
import os
import json
import streamlit as st

####################################################################
# --- CONFIGURACIÓN ---
FILE_CHECKLIST = 'mejoras_checklist.json'
st.set_page_config(page_title="Mejoras", layout="wide")

####################################################################
# --- FUNCIONES ---

def load_checklist():
    """Carga el checklist de mejoras."""
    if not os.path.exists(FILE_CHECKLIST):
        checklist_inicial = [
            {"tarea": "Bloqueadores de campos", "completado": True},
            {"tarea": "Página de mejoras", "completado": True},
            {"tarea": "Gráfico de evolución del patrimonio", "completado": False},
            {"tarea": "Desglose por categoría", "completado": False},
            {"tarea": "Validación de datos duplicados", "completado": False},
            {"tarea": "Exportación a Excel", "completado": False},
            {"tarea": "Comparativa mes a mes", "completado": False},
        ]
        save_checklist(checklist_inicial)
        return checklist_inicial
    
    with open(FILE_CHECKLIST, 'r') as f:
        return json.load(f)

def save_checklist(checklist):
    """Guarda el checklist."""
    with open(FILE_CHECKLIST, 'w') as f:
        json.dump(checklist, f, indent=2)

####################################################################
# --- INTERFAZ ---
st.title("✅ Mejoras Pendientes")

# Cargar checklist
checklist = load_checklist()

# Contar tareas
completadas = sum(1 for t in checklist if t["completado"])
total = len(checklist)
progreso = completadas / total if total > 0 else 0

st.progress(progreso, text=f"{completadas}/{total} completadas")

# Mostrar checklist
st.subheader("Lista de Tareas")
col_check, col_tarea, col_delete = st.columns([0.05, 0.85, 0.1])

col_check.write("✓")
col_tarea.write("**Tarea**")

for i, tarea in enumerate(checklist):
    col_check, col_tarea, col_delete = st.columns([0.05, 0.85, 0.1])
    
    # Checkbox
    completado = col_check.checkbox(
        label="Completado",
        value=tarea["completado"],
        key=f"check_{i}",
        label_visibility="collapsed"
    )
    
    # Texto (tachado si está completado)
    if completado:
        col_tarea.markdown(f"~~{tarea['tarea']}~~")
    else:
        col_tarea.write(tarea["tarea"])
    
    # Botón eliminar
    if col_delete.button("🗑️", key=f"delete_{i}", help="Eliminar"):
        checklist.pop(i)
        save_checklist(checklist)
        st.rerun()
    
    # Guardar cambio de estado
    if completado != tarea["completado"]:
        checklist[i]["completado"] = completado
        save_checklist(checklist)
        st.rerun()

st.divider()

# Agregar nueva tarea
st.subheader("Agregar Nueva Tarea")
col_input, col_button = st.columns([0.9, 0.1])

with col_input:
    nueva_tarea = st.text_input(label="Nueva mejora", label_visibility="collapsed", placeholder="Escribe una nueva mejora...")

with col_button:
    st.write("")  # Espaciador
    st.write("")  # Espaciador
    if st.button("➕", help="Agregar"):
        if nueva_tarea.strip():
            checklist.append({"tarea": nueva_tarea, "completado": False})
            save_checklist(checklist)
            st.rerun()
        else:
            st.error("La tarea no puede estar vacía")
