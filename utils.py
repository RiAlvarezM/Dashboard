# --- CONFIGURACIÓN DE LIBRERIAS ---
import os
import pandas as pd

# --- CONFIGURACIÓN DE LA PÁGINA ---
FILE_DB = 'networth_db.csv'
FILE_PROPS = 'propiedades.csv'
FILE_ACCOUNTS = 'config_cuentas.csv' # Nombres de tus cuentas

# --- 1. GESTIÓN DE CUENTAS (CONFIGURACIÓN) ---
def load_accounts_config():
    if not os.path.exists(FILE_ACCOUNTS):
        # Crear configuración inicial por defecto
        data = {
            'Categoria': ['Ahorro']*9 + ['Inversion']*9 + ['Jubilacion']*9 + ['Deuda']*4 + ['Prestamo']*2,
            'Nombre_Cuenta': [
                # Ahorros
                'EDIOACC - Ahorro R.A.','EDIOACC - Ahorro G.G.','Bco General - Ahorro RyG','Bco General - Ahorro G.G.',
                'Global Bank - Ahorro','Nequi','BAC - Ahorro','Global Online - GG','Schwab',
                
                # Inversiones
                'Profuturo - R.A.','Fortesza RA','Fortesza GG','Paullier Online',
                'Interactive Brokers','Criptos','BAC-Objetivo','Charles Schwab','Global Online - Escuela',
                
                # Jubilaciones
                'EDIOACC Plazo Fijo','EDIOACC - Jubilación R.A.','EDIOACC - Jubilación G.G.',
                'EDIOACC - Aportes R.A.','EDIOACC - Aportes G.G.','EDIOACC - Hipoteca','SIACAP','Copa - Fondo','Progreso',

                # Tarjetas - Deuda
                'Global TC - Graciela','Global MC - Ricardo','BAC - Mastercard','BAC - Visa Smartcash',

                # Préstamos
                '4 Islas','Park Avenue'
            ],
            'Activa': [True]*10
        }
        df = pd.DataFrame(data)
        df.to_csv(FILE_ACCOUNTS, index=False)
        return df
    return pd.read_csv(FILE_ACCOUNTS)

# --- 2. GESTIÓN DE HISTORIAL DETALLADO ---
def get_last_account_values():
    """Obtiene los últimos valores registrados para cada cuenta para pre-llenar el formulario"""
    if not os.path.exists(FILE_TRANS):
        return {}
    
    df = pd.read_csv(FILE_TRANS)
    if df.empty: return {}
    
    # Ordenar por fecha y quedarse con el último registro de cada cuenta
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    latest_date = df['Fecha'].max()
    df_latest = df[df['Fecha'] == latest_date]
    
    return dict(zip(df_latest['Nombre_Cuenta'], df_latest['Valor']))

def save_detailed_transaction(fecha, datos_cuentas):
    """Guarda el desglose cuenta por cuenta"""
    rows = []
    for cuenta, valor in datos_cuentas.items():
        rows.append({'Fecha': fecha, 'Nombre_Cuenta': cuenta, 'Valor': valor})
    
    df_new = pd.DataFrame(rows)
    
    if os.path.exists(FILE_TRANS):
        df_old = pd.read_csv(FILE_TRANS)
        df_final = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df_final = df_new
        
    df_final.to_csv(FILE_TRANS, index=False)

# --- 3. LÓGICA DE PROPIEDADES (MANTENIDA) ---
def load_properties():
    if not os.path.exists(FILE_PROPS):
        return pd.DataFrame(columns=['Propiedad', 'Valor_Avaluo', 'Fecha_Inicio'])
    df = pd.read_csv(FILE_PROPS)
    if 'Fecha_Inicio' in df.columns:
        df['Fecha_Inicio'] = pd.to_datetime(df['Fecha_Inicio'], errors='coerce')
    return df

def save_properties(df):
    df_temp = df.copy()
    if 'Fecha_Inicio' in df_temp.columns:
        df_temp['Fecha_Inicio'] = pd.to_datetime(df_temp['Fecha_Inicio']).dt.strftime('%Y-%m-%d')
    df_temp.to_csv(FILE_PROPS, index=False)

def get_properties_sum(date_cutoff):
    df_props = load_properties()
    if df_props.empty: return 0.0
    # Lógica retroactiva
    validas = df_props[df_props['Fecha_Inicio'] <= pd.to_datetime(date_cutoff)]
    return validas['Valor_Avaluo'].sum()

# --- 4. GESTIÓN HISTÓRICO TOTALES (AGREGADO) ---
def load_history_totals():
    if not os.path.exists(FILE_DB):
        return pd.DataFrame(columns=['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles'])
    df = pd.read_csv(FILE_DB)
    df['Fecha'] = pd.to_datetime(df['Fecha'], format='%Y-%m-%d', errors='coerce')
    df = df.dropna(subset=['Fecha'])
    
    # Recálculo de Propiedades Retroactivo
    df_props = load_properties()
    if not df_props.empty:
         df['Propiedades'] = df['Fecha'].apply(lambda x: df_props[df_props['Fecha_Inicio'] <= x]['Valor_Avaluo'].sum())

    cols_num = ['Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles']
    for col in cols_num:
        if col not in df.columns: df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    df['Total_Financiero'] = (df['Ahorro'] + df['Inversion'] + df['Jubilacion']) - df['Deuda']
    df['Patrimonio'] = df['Total_Financiero'] - df['Prestamo'] + df['Propiedades'] + df['Automoviles']
    return df.sort_values(by='Fecha', ascending=False)

def save_history_totals(new_row):
    df_old = load_history_totals()
    # Eliminar registros previos de la misma fecha si existen para no duplicar al re-guardar
    df_old = df_old[df_old['Fecha'] != pd.to_datetime(new_row['Fecha'])]
    
    df_new = pd.DataFrame([new_row])
    # Asegurar que Fecha sea datetime en ambos antes de concatenar
    df_new['Fecha'] = pd.to_datetime(df_new['Fecha'])
    
    df_final = pd.concat([df_old, df_new], ignore_index=True)
    
    # Guardar solo columnas base
    cols_base = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles']
    df_final[cols_base].to_csv(FILE_DB, index=False)

def save_accounts_config(df):
    df.to_csv(FILE_ACCOUNTS, index=False)

# --- FUNCIONES DE CARGA Y GUARDADO ---
def load_history():
    # 1. Cargar Historial Base
    if not os.path.exists(FILE_DB):
        df = pd.DataFrame(columns=['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles'])
    else:
        df = pd.read_csv(FILE_DB)
        df['Fecha'] = pd.to_datetime(df['Fecha'], format='%Y-%m-%d', errors='coerce')
        df = df.dropna(subset=['Fecha'])

    # 2. Cargar Propiedades para el Recálculo Inteligente
    if os.path.exists(FILE_PROPS):
        df_props = pd.read_csv(FILE_PROPS)
        # Aseguramos que sea fecha datetime
        if 'Fecha_Avaluo' in df_props.columns:
            df_props['Fecha_Avaluo'] = pd.to_datetime(df_props['Fecha_Avaluo'], errors='coerce')
            
            # --- LA MAGIA: RECALCULAR PROPIEDADES RETROACTIVAMENTE ---
            # Función que suma propiedades si su fecha de avalúo es anterior a la fecha del registro histórico
            def calcular_propiedades_al_corte(fecha_corte):
                # Filtra propiedades que ya existían en esa fecha
                props_validas = df_props[df_props['Fecha_Avaluo'] <= fecha_corte]
                return props_validas['Valor_Avaluo'].sum()

            # Aplicamos esta lógica a cada fila del historial
            df['Propiedades'] = df['Fecha'].apply(calcular_propiedades_al_corte)
    
    # 3. Limpieza Numérica General (Igual que antes)
    cols_numericas = ['Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles']
    for col in cols_numericas:
        if col not in df.columns: df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    # 4. Recalcular Patrimonio (Importante porque 'Propiedades' cambió)
    df['Total_Financiero'] = (df['Ahorro'] + df['Inversion'] + df['Jubilacion']) - df['Deuda']
    df['Patrimonio'] = df['Total_Financiero'] - df['Prestamo'] + df['Propiedades'] + df['Automoviles']
    
    df = df.sort_values(by='Fecha', ascending=False)
    return df

def save_history(df_to_save):
    # Antes de guardar, aseguramos que la fecha esté en formato YYYY-MM-DD string para el CSV
    df_temp = df_to_save.copy()
    
    # Si hay columnas calculadas, las quitamos antes de guardar en el CSV base
    cols_base = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles']
    df_temp = df_temp[cols_base]

    
    
    # Guardar
    df_temp.to_csv(FILE_DB, index=False)

def load_properties():
    if not os.path.exists(FILE_PROPS):
        # Si no existe, creamos el archivo con las columnas correctas
        df = pd.DataFrame(columns=['Propiedad', 'Valor_Avaluo', 'Fecha_Avaluo'])
        df.to_csv(FILE_PROPS, index=False)
        return df
    
    df = pd.read_csv(FILE_PROPS)
    
    # --- AQUÍ ESTÁ EL TRUCO ---
    # Convertimos la columna de TEXTO a FECHA (datetime) para que Streamlit no de error
    if 'Fecha_Avaluo' in df.columns:
        df['Fecha_Avaluo'] = pd.to_datetime(df['Fecha_Avaluo'], errors='coerce')
        
    return df

def save_properties(df_props):
    # Antes de guardar, convertimos la fecha a string simple YYYY-MM-DD
    # Esto evita que se guarden horas/minutos innecesarios en el CSV
    df_temp = df_props.copy()
    if 'Fecha_Avaluo' in df_temp.columns:
        df_temp['Fecha_Avaluo'] = pd.to_datetime(df_temp['Fecha_Avaluo']).dt.strftime('%Y-%m-%d')
        
    df_temp.to_csv(FILE_PROPS, index=False)