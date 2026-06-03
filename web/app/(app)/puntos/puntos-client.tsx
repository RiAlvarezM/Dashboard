"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PuntosRecord, PuntosData } from "@/types";
import { formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Lock, Unlock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props { 
  initialPuntos: PuntosRecord[];
  config: PuntosData;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
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
          <span className="font-semibold tabular-nums">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function PuntosClient({ initialPuntos, config }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const latest = initialPuntos[initialPuntos.length - 1] || {};

  const initialValues: Record<string, number> = {};
  config.categorias.forEach(c => {
    initialValues[c.id] = (latest[c.id] as number) || 0;
  });

  const [fecha, setFecha] = useState(today);
  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Fecha: fecha, ...values }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  // Dynamic group totals
  const groupTotals = config.grupos.map(g => {
    const cats = config.categorias.filter(c => c.grupo === g.nombre);
    const total = cats.reduce((sum, c) => sum + (values[c.id] || 0), 0);
    return { ...g, total, cats };
  }).filter(g => g.cats.length > 0);

  const chartData = initialPuntos.map((r) => ({
    fecha: r.Fecha.slice(0, 7),
    ...Object.fromEntries(config.categorias.map((c) => [c.nombre, r[c.id] || 0])),
  }));

  return (
    <div>
      <PageHeader title="Puntos &amp; Millas" description="Tarjetas de crédito y programas de lealtad">
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-40" />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className={`grid grid-cols-${Math.min(groupTotals.length, 4)} gap-3 mb-6`}>
        {groupTotals.map(g => (
          <StatCard key={g.nombre} label={g.nombre} value={formatNumber(g.total)} subValue={g.sub_label || ""} valueClassName={g.color_stat || ""} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Input form */}
        <Card>
          <CardHeader><CardTitle>Registro de Puntos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {config.categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.color }} />
                    {cat.nombre}
                  </Label>
                  <Input
                    type="number" step="1" value={values[cat.id] || 0}
                    onChange={(e) => !locked[cat.id] && setValues((v) => ({ ...v, [cat.id]: parseInt(e.target.value) || 0 }))}
                    disabled={locked[cat.id]} className="h-8 text-sm tabular-nums"
                  />
                </div>
                <Button variant="ghost" size="icon-sm" className="mt-5 shrink-0" onClick={() => setLocked((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}>
                  {locked[cat.id] ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Charts - one per group */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Evolución de Puntos</CardTitle></CardHeader>
          <CardContent>
            {groupTotals.map((g, gi) => (
              <div key={g.nombre} className={gi > 0 ? "mt-4" : ""}>
                <p className="text-xs text-muted-foreground mb-2 font-medium">{g.nombre}</p>
                <ResponsiveContainer width="100%" height={Math.max(120, 200 - gi * 30)}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={7} />
                    {g.cats.map((c) => (
                      <Line key={c.id} type="monotone" dataKey={c.nombre} stroke={c.color} strokeWidth={2} dot={{ r: 3, fill: c.color }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Historical table */}
      <Card>
        <CardHeader><CardTitle>Historial ({initialPuntos.length} registros)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                  {config.categorias.map((c) => (
                    <th key={c.id} className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">{c.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...initialPuntos].reverse().map((r) => (
                  <tr key={r.Fecha} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{r.Fecha}</td>
                    {config.categorias.map((c) => (
                      <td key={c.id} className="px-4 py-2.5 text-right tabular-nums" style={{ color: c.color }}>
                        {formatNumber((r[c.id] as number) || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
