import os
import json
from datetime import date
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Dashboard Cuentas API")

# Setup CORS to allow the frontend to interact with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_DB = 'networth_db.csv'
FILE_CUENTAS = 'cuentas.csv'

AUTOS = [
    {"nombre": "Civic", "valor": 30000.00, "fecha": date(2018, 12, 1)},
    {"nombre": "CRV", "valor": 17500.00, "fecha": date(2013, 1, 1)},
]

PROPIEDADES = [
    {"nombre": "Park Avenue", "valor": 224900.00, "fecha": date(2019, 1, 1)},
    {"nombre": "4 Islas", "valor": 120000.00, "fecha": date(2016, 5, 1)},
]

# --- FUNCIONES DE CÁLCULO ---

def load_cuentas_config():
    if not os.path.exists(FILE_CUENTAS):
        return pd.DataFrame(columns=['Categoria', 'Nombre_Cuenta', 'Monto_Objetivo', 'Incluir', 'Ultimo_Valor'])
    df = pd.read_csv(FILE_CUENTAS)
    df['Incluir'] = df['Incluir'].astype(str).str.lower() == 'true'
    df['Monto_Objetivo'] = pd.to_numeric(df['Monto_Objetivo'], errors='coerce').fillna(0.0)
    if 'Ultimo_Valor' not in df.columns:
        df['Ultimo_Valor'] = 0.0
    df['Ultimo_Valor'] = pd.to_numeric(df['Ultimo_Valor'], errors='coerce').fillna(0.0)
    return df

def years_between(start_date, end_date=None):
    if end_date is None:
        end_date = date.today()
    return (end_date - start_date).days / 365.25

def depreciated_value(value, purchase_date, rate=0.20):
    years = years_between(purchase_date)
    return value * ((1 - rate) ** years)

def calcular_activos_fijos():
    autos_total = sum(depreciated_value(a["valor"], a["fecha"]) for a in AUTOS)
    propiedades_total = sum(p["valor"] for p in PROPIEDADES)
    return autos_total, propiedades_total

def load_db_totals():
    if not os.path.exists(FILE_DB):
        df = pd.DataFrame(columns=['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo', 'Propiedades', 'Automoviles'])
        return df
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

FILE_PRESUPUESTO = 'presupuesto.json'

# --- MODELS ---

class CuentasActualizadas(BaseModel):
    cuentas: Dict[str, float] # real_idx as string to new ultimo_valor mapping
    fecha_registro: str
    totales: Dict[str, float]

class DeleteRequest(BaseModel):
    indices: List[int]

class BudgetUpdate(BaseModel):
    ingresos: Dict[str, float]
    gastos: Dict[str, float]
    inversiones: Dict[str, float]

# --- ENDPOINTS ---

@app.get("/api/dashboard")
def get_dashboard_data():
    df_cuentas = load_cuentas_config()
    df_cuentas_dict = df_cuentas.reset_index().to_dict(orient='records')
    
    # Organizar cuentas por categoria
    categorias = ['Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
    cuentas_por_categoria = {}
    for cat in categorias:
        cuentas_por_categoria[cat] = [c for c in df_cuentas_dict if c['Categoria'] == cat and c['Incluir']]

    autos_total, propiedades_total = calcular_activos_fijos()
    
    df_totals = load_db_totals()
    totales_historia = df_totals.copy()
    totales_historia['Fecha'] = totales_historia['Fecha'].dt.strftime('%Y-%m-%d')
    historia = totales_historia.reset_index().to_dict(orient='records')

    return {
        "cuentas": cuentas_por_categoria,
        "activosFijos": {
            "autos_total": autos_total,
            "propiedades_total": propiedades_total
        },
        "historia": historia
    }

@app.get("/api/budget")
def get_budget():
    if not os.path.exists(FILE_PRESUPUESTO):
        return {"ingresos": {}, "gastos": {}, "inversiones": {}}
    with open(FILE_PRESUPUESTO, 'r') as f:
        return json.load(f)

@app.post("/api/budget")
def update_budget(data: BudgetUpdate):
    with open(FILE_PRESUPUESTO, 'w') as f:
        json.dump(data.dict(), f, indent=2)
    return {"message": "Presupuesto actualizado"}

@app.post("/api/registrar")
def registrar_valores(data: CuentasActualizadas):
    # Guardar en data totals
    df_totals = load_db_totals()
    new_row = {
        'Fecha': pd.to_datetime(data.fecha_registro),
        'Ahorro': data.totales.get('Ahorro', 0.0),
        'Inversion': data.totales.get('Inversion', 0.0),
        'Jubilacion': data.totales.get('Jubilacion', 0.0),
        'Deuda': data.totales.get('Deuda', 0.0),
        'Prestamo': data.totales.get('Prestamo', 0.0),
        'Propiedades': 0, # Calculado luegp
        'Automoviles': 0,
    }
    
    new_df = pd.DataFrame([new_row])
    if df_totals.empty:
        df_totals = new_df
    else:
        df_totals = pd.concat([df_totals, new_df], ignore_index=True)
    
    cols_to_save = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
    df_totals[cols_to_save].to_csv(FILE_DB, index=False)
    
    # Actualizar ultimos valores en cuentas.csv
    df_cuentas = load_cuentas_config()
    for real_idx_str, valor in data.cuentas.items():
        try:
            real_idx = int(real_idx_str)
            if real_idx in df_cuentas.index:
                df_cuentas.loc[real_idx, 'Ultimo_Valor'] = valor
        except:
            continue
    
    df_cuentas.to_csv(FILE_CUENTAS, index=False)
    
    return {"message": "Registro guardado exitosamente"}

@app.post("/api/eliminar")
def eliminar_filas(req: DeleteRequest):
    df_totals = load_db_totals()
    try:
        df_totals.drop(req.indices, inplace=True)
        cols_to_save = ['Fecha', 'Ahorro', 'Inversion', 'Jubilacion', 'Deuda', 'Prestamo']
        df_totals[cols_to_save].to_csv(FILE_DB, index=False)
        return {"message": f"{len(req.indices)} fila(s) eliminada(s)."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
