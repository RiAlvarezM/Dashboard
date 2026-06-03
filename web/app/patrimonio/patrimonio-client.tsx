"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Cuenta, NetWorthRecord, Propiedad } from "@/types";
import { calcularTotales } from "@/lib/calculations";
import { formatCurrency, pctChange } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Lock, Unlock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORIAS = ["Ahorro", "Inversion", "Jubilacion", "Deuda", "Prestamo"] as const;
const CATEGORIA_LABELS: Record<string, string> = {
  Ahorro: "Ahorro",
  Inversion: "Inversión",
  Jubilacion: "Jubilación",
  Deuda: "Deuda",
  Prestamo: "Préstamos",
};
const CATEGORIA_COLORS: Record<string, string> = {
  Ahorro: "text-sky-400",
  Inversion: "text-violet-400",
  Jubilacion: "text-amber-400",
  Deuda: "text-rose-400",
  Prestamo: "text-orange-400",
};

interface Props {
  cuentas: Cuenta[];
  historial: NetWorthRecord[];
  propiedades: Propiedad[];
  propiedadesVal: number;
  automoviles: number;
  lastValues: Record<string, number>;
  today: string;
}

export function PatrimonioClient({ cuentas, historial, propiedades, propiedadesVal, automoviles, lastValues, today }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(lastValues);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(today);
  const [saving, setSaving] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const [historialOpen, setHistorialOpen] = useState(false);

  const totales = useMemo(
    () => calcularTotales(values, cuentas, propiedades, fecha, automoviles),
    [values, cuentas, propiedades, fecha, automoviles]
  );

  const prev = historial.length >= 2 ? historial[historial.length - 2] : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update cuentas with latest values
      const updatedCuentas = cuentas.map((c) => ({
        ...c,
        Ultimo_Valor: values[c.Nombre_Cuenta] ?? c.Ultimo_Valor,
      }));
      await fetch("/api/cuentas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCuentas),
      });
      // Save networth record
      await fetch("/api/networth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Fecha: fecha,
          Ahorro: totales.Ahorro,
          Inversion: totales.Inversion,
          Jubilacion: totales.Jubilacion,
          Deuda: totales.Deuda,
          Prestamo: totales.Prestamo,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: string) => {
    await fetch("/api/networth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: f }),
    });
    router.refresh();
  };

  const toggleLock = (name: string) => setLocked((prev) => ({ ...prev, [name]: !prev[name] }));
  const toggleCat = (cat: string) => setCollapsedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const sortedHistorial = [...historial].sort((a, b) => b.Fecha.localeCompare(a.Fecha));

  const donutData = [
    { name: "Ahorro", value: totales.Ahorro, color: "#38bdf8" },
    { name: "Inversión", value: totales.Inversion, color: "#a78bfa" },
    { name: "Jubilación", value: totales.Jubilacion, color: "#fbbf24" },
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Patrimonio"
        description={`Registro de valores al ${fecha}`}
      >
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-40"
        />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </PageHeader>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Patrimonio"
          value={formatCurrency(totales.Patrimonio)}
          trend={prev ? pctChange(totales.Patrimonio, prev.Patrimonio) : undefined}
          trendLabel="vs anterior"
          valueClassName="text-primary"
        />
        <StatCard
          label="Total Financiero"
          value={formatCurrency(totales.Total)}
          trend={prev ? pctChange(totales.Total, prev.Total) : undefined}
        />
        <StatCard
          label="Disponible"
          value={formatCurrency(totales.Disponible)}
          valueClassName={totales.Disponible >= 0 ? "text-positive" : "text-destructive"}
        />
        <StatCard
          label="Propiedades"
          value={formatCurrency(propiedadesVal)}
          subValue="valor avalúo"
        />
        <StatCard
          label="Automóviles"
          value={formatCurrency(automoviles)}
          subValue="valor depreciado"
        />
      </div>

      {/* Visualización de Portafolio */}
      {donutData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Distribución del Portafolio</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   formatter={(val) => formatCurrency(Number(val))} 
                   contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--popover))' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Account inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {CATEGORIAS.map((cat) => {
          const cuentasCat = cuentas.filter((c) => c.Categoria === cat && c.Incluir);
          if (cuentasCat.length === 0) return null;
          const collapsed = collapsedCats[cat];
          const subtotal = cuentasCat.reduce((s, c) => s + (values[c.Nombre_Cuenta] ?? 0), 0);

          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className={CATEGORIA_COLORS[cat]}>{CATEGORIA_LABELS[cat]}</CardTitle>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {formatCurrency(subtotal)}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => toggleCat(cat)}>
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {!collapsed && (
                <CardContent className="space-y-3">
                  {cuentasCat.map((cuenta) => (
                    <div key={cuenta.Nombre_Cuenta} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground truncate block mb-1">
                          {cuenta.Nombre_Cuenta}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={values[cuenta.Nombre_Cuenta] ?? 0}
                          onChange={(e) =>
                            !locked[cuenta.Nombre_Cuenta] &&
                            setValues((v) => ({ ...v, [cuenta.Nombre_Cuenta]: parseFloat(e.target.value) || 0 }))
                          }
                          disabled={locked[cuenta.Nombre_Cuenta]}
                          className="h-8 text-sm tabular-nums"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="mt-5 shrink-0"
                        onClick={() => toggleLock(cuenta.Nombre_Cuenta)}
                        title={locked[cuenta.Nombre_Cuenta] ? "Desbloquear" : "Bloquear"}
                      >
                        {locked[cuenta.Nombre_Cuenta] ? (
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Historical records */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setHistorialOpen((o) => !o)}
          >
            <CardTitle>Historial ({historial.length} registros)</CardTitle>
            {historialOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {historialOpen && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Patrimonio</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Ahorro</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Inversión</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Deuda</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Préstamo</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {sortedHistorial.map((r) => (
                    <tr key={r.Fecha} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground">{r.Fecha}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-primary">
                        {formatCurrency(r.Patrimonio)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(r.Ahorro)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(r.Inversion)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-destructive">{formatCurrency(r.Deuda)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-orange-400">{formatCurrency(r.Prestamo)}</td>
                      <td className="px-4 py-2.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(r.Fecha)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
