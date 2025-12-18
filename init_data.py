import pandas as pd
import io
import datetime

# 1. Tu data cruda (exactamente como me la pasaste)
raw_data = """Fecha,Ahorro,Inversion,Jubilación,Deuda,Prestamo
noviembre 1 2016,"B/.	31,637.68","B/.	6,310.37",,B/.	0.00,"B/.	106,332.55"
diciembre 12 2016,"B/.	38,172.32","B/.	6,673.21",,B/.	0.00,"B/.	106,245.31"
enero 17 2017,"B/.	43,547.82","B/.	6,892.35",,"B/.	6,991.15","B/.	106,018.91"
marzo 20 2017,"B/.	41,040.63","B/.	7,620.01",,"B/.	3,952.99","B/.	105,597.11"
abril 21 2017,"B/.	40,898.72","B/.	8,094.81",,"B/.	3,044.50","B/.	105,403.16"
mayo 12 2017,"B/.	40,239.94","B/.	8,318.53",,"B/.	3,435.78","B/.	105,173.60"
"""

# 2. Función para limpiar moneda (Quitar "B/.", comas y espacios)
def limpiar_moneda(valor):
    if pd.isna(valor) or valor == '':
        return 0.0
    valor_str = str(valor)
    # Quitar B/., comas, tabulaciones y espacios
    limpio = valor_str.replace('B/.', '').replace(',', '').replace('\t', '').strip()
    try:
        return float(limpio)
    except ValueError:
        return 0.0

# 3. Función para limpiar Fechas en español
meses = {
    "enero": "01", "febrero": "02", "marzo": "03", "abril": "04", "mayo": "05", "junio": "06",
    "julio": "07", "agosto": "08", "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
}

def parsear_fecha_espanol(fecha_str):
    try:
        partes = fecha_str.lower().split()
        if len(partes) == 3: # ej: noviembre 1 2016
            mes_nombre = partes[0]
            dia = partes[1]
            anio = partes[2]
            mes_num = meses.get(mes_nombre, "01")
            # Formatear para que pandas lo entienda standard YYYY-MM-DD
            return f"{anio}-{mes_num}-{dia.zfill(2)}"
    except:
        return None 
    return fecha_str

# 4. Procesamiento
df = pd.read_csv("data.csv")

# Limpieza de columnas financieras
cols_moneda = ['Ahorro', 'Inversion', 'Jubilación', 'Deuda', 'Prestamo']
for col in cols_moneda:
    df[col] = df[col].apply(limpiar_moneda)

# Limpieza de Fecha
df['Fecha'] = df['Fecha'].apply(parsear_fecha_espanol)
df['Fecha'] = pd.to_datetime(df['Fecha'])

# Agregar columnas faltantes (Propiedades y Autos) con valor 0 para el histórico antiguo
df['Propiedades'] = 0.0
df['Automoviles'] = 0.0

# Renombrar Jubilación a Jubilacion (sin tilde para evitar problemas de código)
df = df.rename(columns={'Jubilación': 'Jubilacion'})

# Ordenar cronológicamente
df = df.sort_values(by='Fecha')

# 5. Guardar el archivo maestro limpio
archivo_salida = 'networth_db.csv'
df.to_csv(archivo_salida, index=False)

print(f"✅ Archivo '{archivo_salida}' creado exitosamente con {len(df)} registros.")
print(df.head())