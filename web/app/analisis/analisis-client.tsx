"use client";
import { useMemo } from "react";
import type { NetWorthRecord } from "@/types";
import { formatCurrency, formatDateShort, pctChange } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  historial: NetWorthRecord[];
}

const COLORS = {
  Patrimonio: "#34d399",
  Total: "#818cf8",
  Disponible: "#38bdf8",
  Jubilacion: "#fbbf24",
  Inversion: "#a78bfa",
  Prestamo: "#fb923c",
  Deuda: "#f87171",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
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

export function AnalisisClient({ historial }: Props) {
  const sorted = useMemo(() => [...historial].sort((a, b) => a.Fecha.localeCompare(b.Fecha)), [historial]);

  const chartData = sorted.map((r) => ({
    fecha: r.Fecha.slice(0, 7),
    Patrimonio: r.Patrimonio,
    Total: r.Total,
    Disponible: r.Disponible,
    Jubilacion: r.Jubilacion,
    Inversion: r.Inversion,
    Prestamo: r.Prestamo,
    Deuda: r.Deuda,
  }));

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const oldest = sorted[0];

  const totalReturn = oldest ? pctChange(latest?.Patrimonio ?? 0, oldest.Patrimonio) : 0;

  return (
    <div>
      <PageHeader title="Análisis" description={`${sorted.length} registros desde ${oldest?.Fecha ?? "–"}`} />

      {/* Summary stats */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Patrimonio Actual"
            value={formatCurrency(latest.Patrimonio)}
            trend={prev ? pctChange(latest.Patrimonio, prev.Patrimonio) : undefined}
            trendLabel="vs anterior"
            valueClassName="text-primary"
          />
          <StatCard
            label="Total Financiero"
            value={formatCurrency(latest.Total)}
            trend={prev ? pctChange(latest.Total, prev.Total) : undefined}
          />
          <StatCard
            label="Deuda Total"
            value={formatCurrency(latest.Deuda)}
            trend={prev ? pctChange(latest.Deuda, prev.Deuda) : undefined}
            valueClassName="text-destructive"
          />
          <StatCard
            label="Retorno Total"
            value={`${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(1)}%`}
            subValue={`desde ${oldest?.Fecha?.slice(0, 7) ?? "inicio"}`}
            valueClassName={totalReturn >= 0 ? "text-positive" : "text-destructive"}
          />
        </div>
      )}

      {/* Patrimonio vs Préstamo */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Patrimonio vs Préstamos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.Patrimonio} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.Patrimonio} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="hsl(215 20% 35%)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="Patrimonio" stroke={COLORS.Patrimonio} fillOpacity={1} fill="url(#colorPatrimonio)" strokeWidth={2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Prestamo" stroke={COLORS.Prestamo} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* All components */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Evolución Financiera</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="hsl(215 20% 35%)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="Total" stroke={COLORS.Total} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Disponible" stroke={COLORS.Disponible} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Jubilacion" stroke={COLORS.Jubilacion} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Inversion" stroke={COLORS.Inversion} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deuda chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Deuda</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="Deuda" stroke={COLORS.Deuda} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
