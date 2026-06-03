"use client";
import { useState, useMemo } from "react";
import type { NetWorthRecord, PerfilConfig } from "@/types";
import { calcularProyeccion, calcularAporteNecesario } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Props { 
  historial: NetWorthRecord[];
  perfil: PerfilConfig;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">Año {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function JubilacionClient({ historial, perfil }: Props) {
  const latest = [...historial].sort((a, b) => b.Fecha.localeCompare(a.Fecha))[0];

  const def = perfil.jubilacion_defaults;

  const [birthYear, setBirthYear] = useState(perfil.anio_nacimiento);
  const [retirementAge, setRetirementAge] = useState(def.edad_retiro);
  const [currentBalance, setCurrentBalance] = useState(Math.round(latest?.Jubilacion ?? 44000));
  const [monthlyContribution, setMonthlyContribution] = useState(def.aporte_mensual);
  const [annualIncrease, setAnnualIncrease] = useState(def.aumento_anual);
  const [annualReturn, setAnnualReturn] = useState(def.retorno_anual);
  const [targetBalance, setTargetBalance] = useState(def.meta_balance);
  const [pensionMonthly, setPensionMonthly] = useState(def.pension_mensual);

  const currentAge = new Date().getFullYear() - birthYear;

  const baseParams = {
    currentAge, retirementAge, currentBalance,
    annualIncrease: annualIncrease / 100,
    annualReturn: annualReturn / 100,
    targetBalance, pensionMonthly,
  };

  const projection = useMemo(() => calcularProyeccion({ ...baseParams, monthlyContribution }), [
    currentAge, retirementAge, currentBalance, monthlyContribution, annualIncrease, annualReturn, pensionMonthly,
  ]);

  const requiredContribution = useMemo(() => calcularAporteNecesario(baseParams), [
    currentAge, retirementAge, currentBalance, annualIncrease, annualReturn, targetBalance, pensionMonthly,
  ]);

  const idealProjection = useMemo(() => calcularProyeccion({ ...baseParams, monthlyContribution: requiredContribution }), [
    requiredContribution, currentAge, retirementAge, currentBalance, annualIncrease, annualReturn, pensionMonthly,
  ]);

  // Historical data by year
  const historicalByYear = useMemo(() => {
    const byYear: Record<number, number> = {};
    historial.forEach((r) => {
      const y = parseInt(r.Fecha.slice(0, 4));
      if (!byYear[y] || r.Fecha > String(byYear[y])) byYear[y] = r.Jubilacion;
    });
    return byYear;
  }, [historial]);

  const chartData = projection.map((p, i) => ({
    year: p.year,
    age: p.age,
    "Proyección Actual": p.balance,
    "Proyección Ideal": idealProjection[i]?.balance,
    "Histórico": historicalByYear[p.year],
  }));

  const retirementPoint = projection.find((p) => p.age === retirementAge);
  const yearsToRetirement = retirementAge - currentAge;

  return (
    <div>
      <PageHeader title="Jubilación" description="Proyección y planificación de retiro" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Balance Actual" value={formatCurrency(currentBalance)} subValue="jubilación" />
        <StatCard label="Años para Retiro" value={`${yearsToRetirement} años`} subValue={`a los ${retirementAge}`} />
        <StatCard
          label="Proyección al Retiro"
          value={formatCurrency(retirementPoint?.balance ?? 0)}
          valueClassName={retirementPoint && retirementPoint.balance >= targetBalance ? "text-positive" : "text-destructive"}
        />
        <StatCard
          label="Aporte Necesario"
          value={formatCurrency(requiredContribution)}
          subValue="mensual para meta"
          valueClassName={monthlyContribution >= requiredContribution ? "text-positive" : "text-warning"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Parameters */}
        <Card>
          <CardHeader><CardTitle>Parámetros</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Año de Nacimiento", value: birthYear, set: setBirthYear, min: 1950, max: 2000, step: 1, suffix: `(${currentAge} años)` },
              { label: "Edad de Retiro", value: retirementAge, set: setRetirementAge, min: 50, max: 80, step: 1 },
              { label: "Balance Actual (B/.)", value: currentBalance, set: setCurrentBalance, min: 0, max: 1000000, step: 100 },
              { label: "Aporte Mensual (B/.)", value: monthlyContribution, set: setMonthlyContribution, min: 0, max: 10000, step: 10 },
              { label: "Aumento Anual Aporte (%)", value: annualIncrease, set: setAnnualIncrease, min: 0, max: 20, step: 0.5 },
              { label: "Retorno Anual (%)", value: annualReturn, set: setAnnualReturn, min: 0, max: 20, step: 0.5 },
              { label: "Meta de Balance (B/.)", value: targetBalance, set: setTargetBalance, min: 0, max: 5000000, step: 10000 },
              { label: "Pensión Mensual (B/.)", value: pensionMonthly, set: setPensionMonthly, min: 0, max: 5000, step: 50 },
            ].map(({ label, value, set, min, max, step, suffix }) => (
              <div key={label}>
                <Label className="text-xs text-muted-foreground">{label} {suffix && <span className="text-primary">{suffix}</span>}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => set(parseFloat(e.target.value) || 0)}
                  min={min} max={max} step={step}
                  className="h-8 mt-1 text-sm tabular-nums"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proyección de Jubilación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} iconType="circle" iconSize={8} />
                <ReferenceLine y={targetBalance} stroke="hsl(38 92% 50%)" strokeDasharray="6 3" label={{ value: "Meta", fill: "hsl(38 92% 50%)", fontSize: 11 }} />
                <ReferenceLine x={new Date().getFullYear() + yearsToRetirement} stroke="hsl(215 20% 45%)" strokeDasharray="6 3" />
                <Line type="monotone" dataKey="Proyección Actual" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Proyección Ideal" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="6 3" />
                <Line type="monotone" dataKey="Histórico" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: "#fbbf24" }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity */}
      <Card>
        <CardHeader><CardTitle>Análisis de Sensibilidad — Balance al Retiro</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Aporte Mensual</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Balance</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">vs Meta</th>
                </tr>
              </thead>
              <tbody>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((mult) => {
                  const contrib = monthlyContribution * mult;
                  const pts = calcularProyeccion({ ...baseParams, monthlyContribution: contrib });
                  const balance = pts.find((p) => p.age === retirementAge)?.balance ?? 0;
                  const pct = ((balance / targetBalance) * 100).toFixed(0);
                  const ok = balance >= targetBalance;
                  return (
                    <tr key={mult} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={mult === 1 ? "font-semibold text-primary" : ""}>{formatCurrency(contrib)}/mes</span>
                        {mult === 1 && <span className="ml-2 text-xs text-muted-foreground">(actual)</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(balance)}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${ok ? "text-positive" : "text-warning"}`}>
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
