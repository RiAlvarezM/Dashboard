/**
 * data.ts — Supabase data access layer
 *
 * Usa PostgreSQL en Supabase para todos los datos.
 * Funciona tanto local (supabase-cli) como en producción (Supabase Cloud).
 */

import { createClient } from "@supabase/supabase-js";
import { calcularPropiedades, calcularAutomovilesFromList } from "./calculations";
import type {
  Cuenta,
  NetWorthRecord,
  Budget,
  Flow,
  PuntosRecord,
  Propiedad,
  TarjetasData,
  PerfilConfig,
  Vehiculo,
  PrestamosData,
} from "@/types";

// ─── Inicializar cliente Supabase ────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);

function checkSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
  }
}

// ─── Cuentas ────────────────────────────────────────────────────────────────

export async function getCuentas(): Promise<Cuenta[]> {
  const { data, error } = await supabase
    .from("cuentas")
    .select("categoria, nombre_cuenta, monto_objetivo, incluir, ultimo_valor");

  if (error) throw error;
  return (data || []).map((r) => ({
    Categoria: r.categoria as Cuenta["Categoria"],
    Nombre_Cuenta: r.nombre_cuenta,
    Monto_Objetivo: r.monto_objetivo,
    Incluir: r.incluir,
    Ultimo_Valor: r.ultimo_valor,
  }));
}

export async function saveCuentas(cuentas: Cuenta[]): Promise<void> {
  await supabase.from("cuentas").delete().neq("nombre_cuenta", "");

  if (cuentas.length === 0) return;

  const { error } = await supabase.from("cuentas").insert(
    cuentas.map((c) => ({
      categoria: c.Categoria,
      nombre_cuenta: c.Nombre_Cuenta,
      monto_objetivo: c.Monto_Objetivo,
      incluir: c.Incluir,
      ultimo_valor: c.Ultimo_Valor,
    }))
  );

  if (error) throw error;
}

// ─── Net Worth ───────────────────────────────────────────────────────────────

export async function getNetWorthDB(): Promise<NetWorthRecord[]> {
  const { data, error } = await supabase
    .from("networth")
    .select("fecha, ahorro, inversion, jubilacion, deuda, prestamo")
    .order("fecha", { ascending: true });

  if (error) throw error;

  const propiedades = await getPropiedades();
  const vehiculos = await getVehiculos();
  const automoviles = calcularAutomovilesFromList(vehiculos);

  return (data || []).map((r) => {
    const propiedadesVal = calcularPropiedades(propiedades, r.fecha);
    const { ahorro, inversion, jubilacion, deuda, prestamo } = r;
    const Total = ahorro + inversion + jubilacion - deuda;
    const Disponible = ahorro - deuda;
    const Patrimonio = Total - prestamo + propiedadesVal + automoviles;
    return {
      Fecha: r.fecha,
      Ahorro: ahorro,
      Inversion: inversion,
      Jubilacion: jubilacion,
      Deuda: deuda,
      Prestamo: prestamo,
      Propiedades: propiedadesVal,
      Automoviles: automoviles,
      Total,
      Disponible,
      Patrimonio,
    };
  });
}

export async function appendNetWorthRecord(
  record: Pick<NetWorthRecord, "Fecha" | "Ahorro" | "Inversion" | "Jubilacion" | "Deuda" | "Prestamo">
): Promise<void> {
  const { error } = await supabase.from("networth").upsert({
    fecha: record.Fecha,
    ahorro: record.Ahorro,
    inversion: record.Inversion,
    jubilacion: record.Jubilacion,
    deuda: record.Deuda,
    prestamo: record.Prestamo,
  });

  if (error) throw error;
}

export async function deleteNetWorthRecord(fecha: string): Promise<void> {
  const { error } = await supabase.from("networth").delete().eq("fecha", fecha);
  if (error) throw error;
}

// ─── Propiedades ────────────────────────────────────────────────────────────

export async function getPropiedades(): Promise<Propiedad[]> {
  const { data, error } = await supabase
    .from("propiedades")
    .select("propiedad, valor_avaluo, fecha_avaluo");

  if (error) throw error;
  return (data || []).map((r) => ({
    Propiedad: r.propiedad,
    Valor_Avaluo: r.valor_avaluo,
    Fecha_Avaluo: r.fecha_avaluo,
  }));
}

export async function savePropiedades(propiedades: Propiedad[]): Promise<void> {
  await supabase.from("propiedades").delete().neq("propiedad", "");

  if (propiedades.length === 0) return;

  const { error } = await supabase.from("propiedades").insert(
    propiedades.map((p) => ({
      propiedad: p.Propiedad,
      valor_avaluo: p.Valor_Avaluo,
      fecha_avaluo: p.Fecha_Avaluo,
    }))
  );

  if (error) throw error;
}

// ─── Budget / Presupuesto ───────────────────────────────────────────────────

export async function getBudget(): Promise<Budget> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "presupuesto").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return {};

  return (data.value as Budget) || {};
}

export async function saveBudget(budget: Budget): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "presupuesto",
    value: budget,
  });

  if (error) throw error;
}

// ─── Flows / Flujo ──────────────────────────────────────────────────────────

export async function getFlows(): Promise<Flow[]> {
  const { data, error } = await supabase
    .from("flows")
    .select("id, kind, name, amount, frequency, start_date, end_date, day_of_month, notes");

  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    kind: r.kind as Flow["kind"],
    name: r.name,
    amount: r.amount,
    frequency: r.frequency as Flow["frequency"],
    start_date: r.start_date,
    end_date: r.end_date ?? undefined,
    day_of_month: r.day_of_month ?? undefined,
    notes: r.notes ?? undefined,
  }));
}

export async function saveFlows(flows: Flow[]): Promise<void> {
  await supabase.from("flows").delete().neq("id", "");

  if (flows.length === 0) return;

  const { error } = await supabase.from("flows").insert(
    flows.map((f, i) => ({
      id: f.id || `flow-${i}`,
      kind: f.kind,
      name: f.name,
      amount: f.amount,
      frequency: f.frequency,
      start_date: f.start_date,
      end_date: f.end_date ?? null,
      day_of_month: f.day_of_month ?? null,
      notes: f.notes ?? null,
    }))
  );

  if (error) throw error;
}

// ─── Perfil ─────────────────────────────────────────────────────────────────

const DEFAULT_PERFIL: PerfilConfig = {
  nombre: "Usuario",
  moneda: "B/.",
  locale: "es-PA",
  anio_nacimiento: 1990,
  jubilacion_defaults: {
    edad_retiro: 65,
    aporte_mensual: 500,
    aumento_anual: 3,
    retorno_anual: 7,
    meta_balance: 500000,
    pension_mensual: 800,
  },
};

export async function getPerfil(): Promise<PerfilConfig> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "perfil").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return DEFAULT_PERFIL;

  return (data.value as PerfilConfig) || DEFAULT_PERFIL;
}

export async function savePerfil(data: PerfilConfig): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "perfil",
    value: data,
  });

  if (error) throw error;
}

// ─── Vehículos ──────────────────────────────────────────────────────────────

const DEFAULT_VEHICULOS: Vehiculo[] = [
  { id: "v1", nombre: "Honda Civic", valor_original: 30000, anio_compra: 2018 },
  { id: "v2", nombre: "Honda CRV", valor_original: 17500, anio_compra: 2013 },
];

export async function getVehiculos(): Promise<Vehiculo[]> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "vehiculos").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return DEFAULT_VEHICULOS;

  return (data.value as Vehiculo[]) || DEFAULT_VEHICULOS;
}

export async function saveVehiculos(data: Vehiculo[]): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "vehiculos",
    value: data,
  });

  if (error) throw error;
}

// ─── Puntos config ──────────────────────────────────────────────────────────

const DEFAULT_PUNTOS_CONFIG: import("@/types").PuntosData = {
  categorias: [
    { id: "Global_TC_GG", nombre: "Global TC (Graciela)", color: "#34d399", equivalencia_dolar: 0, grupo: "Tarjetas" },
    { id: "Global_MC_RA", nombre: "Global MC (Ricardo)", color: "#38bdf8", equivalencia_dolar: 0, grupo: "Tarjetas" },
    { id: "BAC_Visa", nombre: "BAC Visa", color: "#818cf8", equivalencia_dolar: 0, grupo: "Tarjetas" },
    { id: "Copa_RA", nombre: "Copa Miles (Ricardo)", color: "#fbbf24", equivalencia_dolar: 0, grupo: "Millas" },
    { id: "Copa_GG", nombre: "Copa Miles (Graciela)", color: "#fb923c", equivalencia_dolar: 0, grupo: "Millas" },
    { id: "Marriott", nombre: "Marriott Bonvoy", color: "#e879f9", equivalencia_dolar: 0, grupo: "Hoteles" },
    { id: "Otros", nombre: "Otros", color: "#94a3b8", equivalencia_dolar: 0, grupo: "Otros" },
  ],
  grupos: [
    { nombre: "Tarjetas", sub_label: "puntos acumulados" },
    { nombre: "Millas", color_stat: "text-amber-400", sub_label: "ConnectMiles" },
    { nombre: "Hoteles", color_stat: "text-pink-400", sub_label: "puntos hotel" },
    { nombre: "Otros", sub_label: "otros programas" },
  ],
};

export async function getPuntosConfig(): Promise<import("@/types").PuntosData> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "puntos_config").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return DEFAULT_PUNTOS_CONFIG;

  const parsed = (data.value as import("@/types").PuntosData) || DEFAULT_PUNTOS_CONFIG;
  if (!parsed.grupos) parsed.grupos = DEFAULT_PUNTOS_CONFIG.grupos;
  parsed.categorias = parsed.categorias.map((c: import("@/types").PuntoConfig) => ({
    ...c,
    grupo: c.grupo || "Otros",
  }));
  return parsed;
}

export async function savePuntosConfig(data: import("@/types").PuntosData): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "puntos_config",
    value: data,
  });

  if (error) throw error;
}

// ─── Puntos DB ──────────────────────────────────────────────────────────────

export async function getPuntos(): Promise<PuntosRecord[]> {
  const { data, error } = await supabase
    .from("puntos")
    .select("fecha, categoria, valor")
    .order("fecha", { ascending: true });

  if (error) throw error;

  const map = new Map<string, PuntosRecord>();
  for (const r of data || []) {
    if (!map.has(r.fecha)) map.set(r.fecha, { Fecha: r.fecha });
    map.get(r.fecha)![r.categoria] = r.valor;
  }
  return Array.from(map.values()).sort((a, b) => a.Fecha.localeCompare(b.Fecha));
}

export async function appendPuntosRecord(record: PuntosRecord): Promise<void> {
  const { Fecha, ...cats } = record;
  const rows = Object.entries(cats).map(([cat, val]) => ({
    fecha: Fecha,
    categoria: cat,
    valor: val,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("puntos").upsert(rows);
  if (error) throw error;
}

// ─── Tarjetas ───────────────────────────────────────────────────────────────

const DEFAULT_TARJETAS: TarjetasData = {
  tarjetas: [],
  fuentes_disponible: { categorias: [], cuentas_extra: [] },
};

export async function getTarjetas(): Promise<TarjetasData> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "tarjetas").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return DEFAULT_TARJETAS;

  return (data.value as TarjetasData) || DEFAULT_TARJETAS;
}

export async function saveTarjetas(data: TarjetasData): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "tarjetas",
    value: data,
  });

  if (error) throw error;
}

// ─── Préstamos ──────────────────────────────────────────────────────────────

export async function getPrestamos(): Promise<PrestamosData> {
  const { data, error } = await supabase.from("config").select("value").eq("key", "prestamos").single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return { prestamos: [] };

  return (data.value as PrestamosData) || { prestamos: [] };
}

export async function savePrestamos(data: PrestamosData): Promise<void> {
  const { error } = await supabase.from("config").upsert({
    key: "prestamos",
    value: data,
  });

  if (error) throw error;
}
