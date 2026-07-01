import { parseISO, addDays, addMonths, format } from "date-fns";
import type { Cuenta, NetWorthRecord, Propiedad, Vehiculo, Flow, MonthlyFlowSummary } from "@/types";

export function deprecatedValue(originalValue: number, purchaseYear: number, ratePerYear = 0.2, asOfYear?: number) {
  const refYear = asOfYear ?? new Date().getFullYear();
  const years = Math.max(0, refYear - purchaseYear);
  return Math.max(0, originalValue * Math.pow(1 - ratePerYear, years));
}

export function calcularAutomovilesFromList(vehiculos: Vehiculo[], asOfYear?: number): number {
  return vehiculos.reduce((sum, v) => sum + deprecatedValue(v.valor_original, v.anio_compra, v.tasa_depreciacion ?? 0.2, asOfYear), 0);
}

// Keep backwards compat alias
export function calcularAutomoviles(): number {
  return 0;
}

export function calcularPropiedades(propiedades: Propiedad[], fecha?: string): number {
  const refDate = fecha ? new Date(fecha) : new Date();
  return propiedades
    .filter((p) => new Date(p.Fecha_Avaluo) <= refDate)
    .reduce((sum, p) => sum + p.Valor_Avaluo, 0);
}

export function calcularTotales(
  cuentaValues: Record<string, number>,
  cuentas: Cuenta[],
  propiedades: Propiedad[],
  fecha?: string,
  automovilesValor?: number
): Omit<NetWorthRecord, "Fecha"> {
  const sumCategory = (cat: string) =>
    cuentas
      .filter((c) => c.Categoria === cat && c.Incluir)
      .reduce((sum, c) => sum + (cuentaValues[c.Nombre_Cuenta] ?? 0), 0);

  const Ahorro = sumCategory("Ahorro");
  const Inversion = sumCategory("Inversion");
  const Jubilacion = sumCategory("Jubilacion");
  const Deuda = sumCategory("Deuda");
  const Prestamo = sumCategory("Prestamo");
  const Propiedades = calcularPropiedades(propiedades, fecha);
  const Automoviles = automovilesValor !== undefined ? automovilesValor : calcularAutomoviles();

  const Total = Ahorro + Inversion + Jubilacion - Deuda;
  const Disponible = Ahorro - Deuda;
  const Patrimonio = Total - Prestamo + Propiedades + Automoviles;

  return { Ahorro, Inversion, Jubilacion, Deuda, Prestamo, Propiedades, Automoviles, Total, Disponible, Patrimonio };
}

// ─── Retirement projections ────────────────────────────────────────────────

export interface RetirementParams {
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  monthlyContribution: number;
  annualIncrease: number;
  annualReturn: number;
  targetBalance: number;
  pensionMonthly: number;
}

export interface RetirementPoint {
  year: number;
  age: number;
  balance: number;
}

export function calcularProyeccion(params: RetirementParams): RetirementPoint[] {
  const {
    currentAge, retirementAge, currentBalance,
    monthlyContribution, annualIncrease, annualReturn, pensionMonthly,
  } = params;
  const currentYear = new Date().getFullYear();
  const points: RetirementPoint[] = [];
  let balance = currentBalance;
  let contribution = monthlyContribution;

  const yearsToProject = Math.max(retirementAge - currentAge + 20, 30);

  for (let i = 0; i <= yearsToProject; i++) {
    const age = currentAge + i;
    const year = currentYear + i;
    points.push({ year, age, balance: Math.round(balance) });

    if (age < retirementAge) {
      balance = balance * (1 + annualReturn) + contribution * 12;
      contribution *= (1 + annualIncrease);
    } else {
      balance = balance * (1 + annualReturn * 0.5) + pensionMonthly * 12;
    }
  }

  return points;
}

export function calcularAporteNecesario(params: Omit<RetirementParams, "monthlyContribution">): number {
  let low = 0;
  let high = 50000;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    const points = calcularProyeccion({ ...params, monthlyContribution: mid });
    const retirementPoint = points.find((p) => p.age === params.retirementAge);
    if (retirementPoint && retirementPoint.balance >= params.targetBalance) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return Math.round((low + high) / 2);
}

// ─── Cash flow generation ──────────────────────────────────────────────────

export function generarSchedule(flows: Flow[], year: number): MonthlyFlowSummary[] {
  const monthlySummary: Record<string, MonthlyFlowSummary> = {};

  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, "0")}`;
    monthlySummary[key] = { month: key, income: 0, expense: 0, investment: 0, net: 0, net_ex_investment: 0, cumulative: 0 };
  }

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  for (const flow of flows) {
    const start = parseISO(flow.start_date);
    const end = flow.end_date ? parseISO(flow.end_date) : yearEnd;
    const occurrences: Date[] = [];

    if (flow.frequency === "once") {
      if (start >= yearStart && start <= yearEnd) occurrences.push(start);
    } else if (flow.frequency === "monthly") {
      let d = new Date(year, 0, flow.day_of_month ?? 1);
      while (d <= yearEnd) {
        if (d >= yearStart && d >= start && d <= end) occurrences.push(new Date(d));
        d = addMonths(d, 1);
      }
    } else if (flow.frequency === "biweekly") {
      let d = new Date(start);
      while (d <= yearEnd) {
        if (d >= yearStart && d <= end) occurrences.push(new Date(d));
        d = addDays(d, 14);
      }
    } else if (flow.frequency === "weekly") {
      let d = new Date(start);
      while (d <= yearEnd) {
        if (d >= yearStart && d <= end) occurrences.push(new Date(d));
        d = addDays(d, 7);
      }
    }

    for (const occ of occurrences) {
      const key = format(occ, "yyyy-MM");
      const entry = monthlySummary[key];
      if (entry) {
        entry[flow.kind] += flow.amount;
      }
    }
  }

  let cumulative = 0;
  return Object.values(monthlySummary).map((m) => {
    m.net = m.income - m.expense - m.investment;
    m.net_ex_investment = m.income - m.expense;
    cumulative += m.net;
    m.cumulative = cumulative;
    return m;
  });
}
