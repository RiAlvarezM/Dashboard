"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Flow, FlowKind, FlowFrequency } from "@/types";
import { generarSchedule } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2, Plus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar,
} from "recharts";

interface Props { initialFlows: Flow[]; year: number }

const KIND_COLORS: Record<FlowKind, string> = {
  income: "#34d399",
  expense: "#f87171",
  investment: "#818cf8",
};
const KIND_LABELS: Record<FlowKind, string> = {
  income: "Ingreso",
  expense: "Gasto",
  investment: "Inversión",
};
const FREQ_LABELS: Record<FlowFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  once: "Una vez",
};

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const monthIdx = parseInt((label ?? "0").slice(-2)) - 1;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">{MONTH_NAMES[monthIdx]}</p>
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

export function FlujoClient({ initialFlows, year }: Props) {
  const router = useRouter();
  const [flows, setFlows] = useState(initialFlows);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newFlow, setNewFlow] = useState<Omit<Flow, "id">>({
    kind: "income",
    name: "",
    amount: 0,
    frequency: "monthly",
    start_date: `${year}-01-01`,
  });

  const schedule = useMemo(() => generarSchedule(flows, year), [flows, year]);

  const totals = useMemo(() => ({
    income: schedule.reduce((s, m) => s + m.income, 0),
    expense: schedule.reduce((s, m) => s + m.expense, 0),
    investment: schedule.reduce((s, m) => s + m.investment, 0),
    net: schedule.reduce((s, m) => s + m.net, 0),
  }), [schedule]);

  const chartData = schedule.map((m) => ({
    month: m.month,
    Ingresos: m.income,
    Gastos: m.expense,
    Inversiones: m.investment,
    "Flujo Neto": m.net_ex_investment,
    "Acumulado": m.cumulative,
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/flujo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flows),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const addFlow = () => {
    const flow: Flow = { ...newFlow, id: `flow-${Date.now()}` };
    setFlows((prev) => [...prev, flow]);
    setShowForm(false);
    setNewFlow({ kind: "income", name: "", amount: 0, frequency: "monthly", start_date: `${year}-01-01` });
  };

  const deleteFlow = (id: string) => setFlows((prev) => prev.filter((f) => f.id !== id));

  return (
    <div>
      <PageHeader title={`Flujo Anual ${year}`} description="Proyección de ingresos y gastos mensuales">
        <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" />
          Agregar Flujo
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Ingresos Anuales" value={formatCurrency(totals.income)} valueClassName="text-positive" />
        <StatCard label="Gastos Anuales" value={formatCurrency(totals.expense)} valueClassName="text-destructive" />
        <StatCard label="Inversiones Anuales" value={formatCurrency(totals.investment)} valueClassName="text-violet-400" />
        <StatCard
          label="Flujo Neto"
          value={formatCurrency(totals.net)}
          valueClassName={totals.net >= 0 ? "text-positive" : "text-destructive"}
        />
      </div>

      {/* New flow form */}
      {showForm && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Nuevo Flujo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={newFlow.kind} onValueChange={(v) => setNewFlow((p) => ({ ...p, kind: v as FlowKind }))}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="investment">Inversión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <Input className="h-8 mt-1" value={newFlow.name} onChange={(e) => setNewFlow((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Monto (B/.)</Label>
                <Input className="h-8 mt-1 tabular-nums" type="number" value={newFlow.amount} onChange={(e) => setNewFlow((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Frecuencia</Label>
                <Select value={newFlow.frequency} onValueChange={(v) => setNewFlow((p) => ({ ...p, frequency: v as FlowFrequency }))}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="once">Una vez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fecha inicio</Label>
                <Input className="h-8 mt-1" type="date" value={newFlow.start_date} onChange={(e) => setNewFlow((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addFlow} disabled={!newFlow.name}>Agregar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader><CardTitle>Flujo Mensual</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => MONTH_NAMES[parseInt(v.slice(-2)) - 1]}
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={7} />
                <Bar dataKey="Gastos" fill="#f87171" stackId="a" />
                <Bar dataKey="Inversiones" fill="#818cf8" stackId="a" />
                <Bar dataKey="Flujo Neto" fill="#34d399" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Flujo Acumulado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => MONTH_NAMES[parseInt(v.slice(-2)) - 1]}
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={7} />
                <ReferenceLine y={0} stroke="hsl(215 20% 45%)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Flujo Neto" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Acumulado" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary table */}
      <Card className="mb-4">
        <CardHeader><CardTitle>Resumen Mensual</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Mes", "Ingresos", "Gastos", "Inversiones", "Flujo Neto", "Acumulado"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((m) => (
                  <tr key={m.month} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2 text-muted-foreground">{MONTH_NAMES[parseInt(m.month.slice(-2)) - 1]}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-positive">{formatCurrency(m.income)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-destructive">{formatCurrency(m.expense)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-violet-400">{formatCurrency(m.investment)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums font-medium ${m.net >= 0 ? "text-positive" : "text-destructive"}`}>
                      {formatCurrency(m.net)}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums ${m.cumulative >= 0 ? "text-foreground" : "text-destructive"}`}>
                      {formatCurrency(m.cumulative)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Flows list */}
      <Card>
        <CardHeader><CardTitle>Flujos Configurados ({flows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Tipo", "Nombre", "Monto", "Frecuencia", "Inicio", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flows.map((f) => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2">
                      <Badge
                        variant={f.kind === "income" ? "positive" : f.kind === "expense" ? "negative" : "secondary"}
                        className="text-xs"
                      >
                        {KIND_LABELS[f.kind]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-medium">{f.name}</td>
                    <td className="px-4 py-2 tabular-nums">{formatCurrency(f.amount)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{FREQ_LABELS[f.frequency]}</td>
                    <td className="px-4 py-2 text-muted-foreground">{f.start_date}</td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteFlow(f.id)} className="hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
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
