"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Budget } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Plus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Props { initialBudget: Budget }

const CAT_LABELS: Record<string, string> = {
  gastos: "Gastos",
  ingresos: "Ingresos",
  inversiones: "Inversiones",
};

const COLORS = ["#34d399", "#818cf8", "#38bdf8", "#fbbf24", "#f87171", "#a78bfa", "#fb923c", "#4ade80", "#e879f9", "#67e8f9"];

function BudgetTable({
  items,
  onUpdate,
  onDelete,
  onAdd,
  cat,
}: {
  items: Record<string, number>;
  onUpdate: (name: string, value: number) => void;
  onDelete: (name: string) => void;
  onAdd: () => void;
  cat: string;
}) {
  const sorted = Object.entries(items).sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} items — <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </p>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>
      <div className="space-y-1.5">
        {sorted.map(([name, value]) => (
          <div key={name} className="flex items-center gap-2 group">
            <div className="flex-1 text-sm text-muted-foreground truncate">{name}</div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">B/.</span>
              <Input
                type="number"
                value={value}
                onChange={(e) => onUpdate(name, parseFloat(e.target.value) || 0)}
                className="h-7 w-28 text-sm text-right tabular-nums"
                step="0.01"
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(name)}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PresupuestoClient({ initialBudget }: Props) {
  const router = useRouter();
  const [budget, setBudget] = useState(initialBudget);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const ingresos = Object.values(budget.ingresos ?? {}).reduce((s, v) => s + v, 0);
    const gastos = Object.values(budget.gastos ?? {}).reduce((s, v) => s + v, 0);
    const inversiones = Object.values(budget.inversiones ?? {}).reduce((s, v) => s + v, 0);
    return { ingresos, gastos, inversiones, balance: ingresos - gastos - inversiones };
  }, [budget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/presupuesto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budget),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (cat: string, name: string, value: number) => {
    setBudget((prev) => ({ ...prev, [cat]: { ...prev[cat], [name]: value } }));
  };

  const deleteItem = (cat: string, name: string) => {
    setBudget((prev) => {
      const updated = { ...prev[cat] };
      delete updated[name];
      return { ...prev, [cat]: updated };
    });
  };

  const addItem = (cat: string) => {
    const name = `Nuevo item ${Date.now()}`;
    setBudget((prev) => ({ ...prev, [cat]: { ...prev[cat], [name]: 0 } }));
  };

  // Top 10 gastos for chart
  const topGastos = Object.entries(budget.gastos ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const pieData = [
    { name: "Gastos", value: totals.gastos },
    { name: "Inversiones", value: totals.inversiones },
    { name: "Balance", value: Math.max(0, totals.balance) },
  ];

  return (
    <div>
      <PageHeader title="Presupuesto" description="Ingresos, gastos e inversiones mensuales">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Ingresos"
          value={formatCurrency(totals.ingresos)}
          valueClassName="text-positive"
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(totals.gastos)}
          valueClassName="text-destructive"
        />
        <StatCard
          label="Inversiones"
          value={formatCurrency(totals.inversiones)}
          valueClassName="text-violet-400"
        />
        <StatCard
          label="Balance"
          value={formatCurrency(totals.balance)}
          valueClassName={totals.balance >= 0 ? "text-positive" : "text-destructive"}
          subValue={`${((totals.balance / totals.ingresos) * 100).toFixed(1)}% de ingresos`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Tabs for items */}
        <Card className="xl:col-span-2">
          <CardContent className="pt-5">
            <Tabs defaultValue="gastos">
              <TabsList>
                {Object.keys(budget).map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {CAT_LABELS[cat] ?? cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(budget).map(([cat, items]) => (
                <TabsContent key={cat} value={cat}>
                  <BudgetTable
                    items={items}
                    cat={cat}
                    onUpdate={(name, value) => updateItem(cat, name, value)}
                    onDelete={(name) => deleteItem(cat, name)}
                    onAdd={() => addItem(cat)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader><CardTitle>Distribución de Ingresos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={["#f87171", "#818cf8", "#34d399"][index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tasa de ahorro</span>
                <span className="font-medium text-positive">{((totals.balance / totals.ingresos) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tasa de gasto</span>
                <span className="font-medium text-destructive">{((totals.gastos / totals.ingresos) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tasa de inversión</span>
                <span className="font-medium text-violet-400">{((totals.inversiones / totals.ingresos) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top gastos bar chart */}
      <Card>
        <CardHeader><CardTitle>Top 10 Gastos</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topGastos} layout="vertical" margin={{ top: 5, right: 40, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 14%)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                width={95}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" fill="#f87171" radius={[0, 4, 4, 0]}>
                {topGastos.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
