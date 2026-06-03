// User profile configuration
export interface PerfilConfig {
  nombre: string;
  moneda: string; // e.g., "B/.", "$", "€"
  locale: string; // e.g., "es-PA", "es-MX"
  anio_nacimiento: number;
  jubilacion_defaults: {
    edad_retiro: number;
    aporte_mensual: number;
    aumento_anual: number; // percentage
    retorno_anual: number; // percentage
    meta_balance: number;
    pension_mensual: number;
  };
}

// Account configuration
export type Categoria = "Ahorro" | "Inversion" | "Jubilacion" | "Deuda" | "Prestamo";

export interface Cuenta {
  Categoria: Categoria;
  Nombre_Cuenta: string;
  Monto_Objetivo: number;
  Incluir: boolean;
  Ultimo_Valor: number;
}

// Net worth record
export interface NetWorthRecord {
  Fecha: string;
  Ahorro: number;
  Inversion: number;
  Jubilacion: number;
  Deuda: number;
  Prestamo: number;
  Propiedades: number;
  Automoviles: number;
  Total: number;
  Disponible: number;
  Patrimonio: number;
}

// Prestamos / Amortizacion
export interface AmortizacionRecord {
  ano: number;
  mes: string;
  pago_num: number;
  neto: number;
  total: number;
  capital: number;
  extra: number;
  interes: number;
  mantenimiento: number;
  feci: number;
  gastos: number;
  alquiler: number;
  balance: number;
  balance_teorico: number;
  capital_acum: number;
  interes_acum: number;
  pagado_total: number;
  porcentaje: number;
  notas: string;
}

export interface Prestamo {
  id: string;
  nombre: string;
  tipo: string;
  amortizacion: AmortizacionRecord[];
}

export interface PrestamosData {
  prestamos: Prestamo[];
}

// Budget
export interface BudgetItem {
  nombre: string;
  monto: number;
}

export interface Budget {
  [categoria: string]: Record<string, number>;
}

// Cash flow
export type FlowKind = "income" | "expense" | "investment";
export type FlowFrequency = "weekly" | "biweekly" | "monthly" | "once";

export interface Flow {
  id: string;
  kind: FlowKind;
  name: string;
  amount: number;
  frequency: FlowFrequency;
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  notes?: string;
}

export interface MonthlyFlowSummary {
  month: string;
  income: number;
  expense: number;
  investment: number;
  net: number;
  net_ex_investment: number;
  cumulative: number;
}

// Loyalty points
export interface PuntosRecord {
  Fecha: string;
  [key: string]: string | number;
}

export interface PuntoConfig {
  id: string; // The key used in the CSV, e.g., "Global_TC_GG"
  nombre: string; // Display name
  color: string; // Hex color for charts
  equivalencia_dolar: number; // How much 1 point is worth in dollars
  grupo: string; // Group for chart/stat grouping, e.g., "Tarjetas", "Millas", "Hoteles"
}

export interface PuntosGrupo {
  nombre: string;
  color_stat?: string; // CSS class for the stat card value
  sub_label?: string; // Sub-label for the stat card
}

export interface PuntosData {
  categorias: PuntoConfig[];
  grupos: PuntosGrupo[];
}

// Propiedad
export interface Propiedad {
  Propiedad: string;
  Valor_Avaluo: number;
  Fecha_Avaluo: string;
}

// Vehiculo
export interface Vehiculo {
  id: string;
  nombre: string;
  valor_original: number;
  anio_compra: number;
  tasa_depreciacion?: number; // override default 0.2
}

// Credit card configuration
export interface TarjetaConfig {
  id: string;
  nombre: string;
  cuenta_ref: string;
  fecha_corte: number;
  tipo?: "tarjeta" | "servicio";
  saldo?: number;
  seguro_tipo: "smartcash" | "por_millar_fraccion" | "por_millar_diario";
  seguro_params: Record<string, number>;
  pagable_via_banesco: boolean;
}

export interface TarjetasData {
  tarjetas: TarjetaConfig[];
  fuentes_disponible: {
    categorias: string[];
    cuentas_extra: string[];
  };
}
