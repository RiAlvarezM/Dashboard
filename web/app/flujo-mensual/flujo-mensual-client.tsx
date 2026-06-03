"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Repeat2,
  Wallet,
  Shield,
  Save,
} from "lucide-react";

/* ───────────────────── Types ───────────────────── */

interface TarjetaConSaldo {
  id: string;
  nombre: string;
  cuenta_ref: string;
  fecha_corte: number;
  seguro_tipo: string;
  seguro_params: Record<string, number>;
  pagable_via_banesco: boolean;
  saldo: number;
}

interface CuentaDisponible {
  nombre: string;
  valor: number;
}

interface Props {
  tarjetas: TarjetaConSaldo[];
  disponible: number;
  cuentasDisponible: CuentaDisponible[];
}

interface TimelineEntry {
  id: string;
  nombre: string;
  fecha_corte: number;
  fecha_sugerida: Date;
  color: string;
  saldo: number;
  seguro: number;
  cashPayment: number;
  deduccion: number;
  balanceDespues: number;
  consolidado: boolean;
  postergado?: boolean;
  yaPagado?: boolean;
  incluyeConsolidados?: { nombre: string; saldo: number; seguro: number }[];
}

/* ───────────────────── Date calc ───────────────────── */

function getSuggestedPaymentDate(cutoffDay: number): Date {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), cutoffDay);
  let count = 0;
  // Subtract 3 business days
  while (count < 3) {
    d.setDate(d.getDate() - 1);
    // 0 = Sunday, 6 = Saturday
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      count++;
    }
  }
  return d;
}

/* ───────────────────── Constants ───────────────────── */

const CARD_COLORS: Record<string, string> = {
  smartcash: "#38bdf8",
  banesco: "#f97316",
  "global-mc": "#a78bfa",
  "global-tc-gg": "#fb7185",
};

/* ───────────────────── Insurance calc ───────────────────── */

function calcularSeguro(
  seguro_tipo: string,
  seguro_params: Record<string, number>,
  saldo: number,
  diasMes: number
): number {
  if (saldo <= 0) return 0;
  let result = 0;
  switch (seguro_tipo) {
    case "smartcash": {
      const { base, pct, itbms, umbral } = seguro_params;
      result = saldo <= umbral ? base : saldo * pct * (1 + itbms);
      break;
    }
    case "por_millar_fraccion": {
      result = Math.ceil(saldo / 1000) * seguro_params.costo_por_millar;
      break;
    }
    case "por_millar_diario": {
      result = (saldo / 1000) * seguro_params.costo_por_millar * (diasMes / 30);
      break;
    }
  }
  return Math.round(result * 100) / 100;
}

/* ───────────────────── Component ───────────────────── */

export function FlujoMensualClient({
  tarjetas: initialTarjetas,
  disponible,
  cuentasDisponible,
}: Props) {
  const [tarjetas, setTarjetas] = useState(initialTarjetas);
  const [consolidar, setConsolidar] = useState(false);
  const [showCuentas, setShowCuentas] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch full config to preserve other data (like id, tipo, fechas) and only update saldos
      const res = await fetch("/api/tarjetas");
      const currentData = await res.json() as { tarjetas: { id: string; saldo: number; [key: string]: unknown }[] };

      const updatedTarjetas = currentData.tarjetas.map((t) => {
        const localT = tarjetas.find(local => local.id === t.id);
        if (localT) {
          return { ...t, saldo: localT.saldo };
        }
        return t;
      });

      await fetch("/api/tarjetas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarjetas: updatedTarjetas }),
      });
      // Optional: show a success toast here
    } catch (error) {
      console.error("Error saving balances:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSaldo = (id: string, newSaldo: number) => {
    setTarjetas(prev => prev.map(t => t.id === id ? { ...t, saldo: newSaldo } : t));
  };

  const now = new Date();
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fechaHoy = now.toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ── Build timeline ── */
  const timeline = useMemo((): TimelineEntry[] => {
    // Calculate insurance per card (always on original saldo)
    const cardsWithInsurance = tarjetas.map((t) => ({
      ...t,
      seguro: calcularSeguro(t.seguro_tipo, t.seguro_params, t.saldo, diasMes),
      color: CARD_COLORS[t.id] || "#6b7280",
    }));

    let entries: TimelineEntry[];

    if (consolidar) {
      const banesco = cardsWithInsurance.find((c) => c.id === "banesco")!;
      const consolidados = cardsWithInsurance.filter(
        (c) => c.pagable_via_banesco && c.id !== "banesco"
      );
      const directos = cardsWithInsurance.filter(
        (c) => !c.pagable_via_banesco && c.id !== "banesco"
      );

      const consolidadosEsteMes = consolidados.filter(c => c.fecha_corte <= banesco.fecha_corte);

      // Banesco entry includes consolidated amounts ONLY for this month
      const banescoEntry: TimelineEntry = {
        id: banesco.id,
        nombre: banesco.nombre,
        fecha_corte: banesco.fecha_corte,
        fecha_sugerida: getSuggestedPaymentDate(banesco.fecha_corte),
        color: banesco.color,
        saldo:
          banesco.saldo + consolidadosEsteMes.reduce((s, c) => s + c.saldo, 0),
        seguro:
          banesco.seguro + consolidadosEsteMes.reduce((s, c) => s + c.seguro, 0),
        cashPayment:
          banesco.saldo +
          consolidadosEsteMes.reduce((s, c) => s + c.saldo, 0),
        deduccion: 
          banesco.saldo + 
          consolidadosEsteMes.reduce((s, c) => s + c.saldo, 0),
        balanceDespues: 0,
        consolidado: false,
        incluyeConsolidados: consolidadosEsteMes.map((c) => ({
          nombre: c.nombre,
          saldo: c.saldo,
          seguro: c.seguro,
        })),
      };

      // Direct card entries
      const directEntries: TimelineEntry[] = directos.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        fecha_corte: c.fecha_corte,
        fecha_sugerida: getSuggestedPaymentDate(c.fecha_corte),
        color: c.color,
        saldo: c.saldo,
        seguro: c.seguro,
        cashPayment: c.saldo,
        deduccion: c.saldo,
        balanceDespues: 0,
        consolidado: false,
      }));

      // Consolidated card entries (shown dimmed, $0 cash)
      const consolidadoEntries: TimelineEntry[] = consolidados.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        fecha_corte: c.fecha_corte,
        fecha_sugerida: getSuggestedPaymentDate(c.fecha_corte),
        color: c.color,
        saldo: c.saldo,
        seguro: c.seguro,
        cashPayment: 0,
        deduccion: 0,
        balanceDespues: 0,
        consolidado: true,
        postergado: c.fecha_corte > banesco.fecha_corte,
      }));

      entries = [banescoEntry, ...directEntries, ...consolidadoEntries];
    } else {
      entries = cardsWithInsurance.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        fecha_corte: c.fecha_corte,
        fecha_sugerida: getSuggestedPaymentDate(c.fecha_corte),
        color: c.color,
        saldo: c.saldo,
        seguro: c.seguro,
        cashPayment: c.saldo,
        deduccion: c.saldo,
        balanceDespues: 0,
        consolidado: false,
      }));
    }

    // Sort by cut date, then name
    entries.sort(
      (a, b) => a.fecha_corte - b.fecha_corte || a.nombre.localeCompare(b.nombre)
    );

    // Running balance calculation
    const currentDay = now.getDate();
    let balance = disponible;
    for (const entry of entries) {
      if (currentDay >= entry.fecha_corte) {
        entry.deduccion = 0;
        entry.yaPagado = true;
      }
      balance -= entry.deduccion;
      entry.balanceDespues = Math.round(balance * 100) / 100;
    }

    return entries;
  }, [tarjetas, disponible, consolidar, diasMes]);

  /* ── Totals ── */
  const totalSeguros = tarjetas.reduce(
    (s, t) =>
      s + calcularSeguro(t.seguro_tipo, t.seguro_params, t.saldo, diasMes),
    0
  );
  const totalSaldos = tarjetas.reduce((s, t) => s + t.saldo, 0);
  const totalPagos = Math.round(
    timeline.reduce((s, t) => s + t.deduccion, 0) * 100
  ) / 100;
  const balanceFinal = Math.round((disponible - totalPagos) * 100) / 100;
  const alcanza = balanceFinal >= 0;
  const consumedPct = Math.min(100, Math.round((totalPagos / disponible) * 100));

  return (
    <div>
      <PageHeader
        title="Flujo Mensual"
        description={`Hoy es ${fechaHoy}`}
      >
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar Saldos"}
        </Button>
      </PageHeader>

      {/* ── Status banner ── */}
      <Card
        className={cn(
          "mb-6 border-l-4",
          alcanza ? "border-l-positive" : "border-l-destructive"
        )}
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {alcanza ? (
              <CheckCircle2 className="h-6 w-6 text-positive shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  alcanza ? "text-positive" : "text-destructive"
                )}
              >
                {alcanza
                  ? "Alcanza para pagar todas las tarjetas"
                  : `Falta ${formatCurrency(Math.abs(balanceFinal))} para cubrir todo`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alcanza
                  ? `Sobran ${formatCurrency(balanceFinal)} después de pagos pendientes`
                  : `Disponible: ${formatCurrency(disponible)} — Necesario: ${formatCurrency(totalPagos)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Saldo Disponible"
          value={formatCurrency(disponible)}
          valueClassName="text-sky-400"
        />
        <StatCard
          label="Total Tarjetas"
          value={formatCurrency(totalSaldos)}
          valueClassName="text-destructive"
        />
        <StatCard
          label="Seguros del Mes"
          value={formatCurrency(totalSeguros)}
          valueClassName="text-amber-400"
        />
        <StatCard
          label="Balance Final"
          value={formatCurrency(balanceFinal)}
          valueClassName={alcanza ? "text-positive" : "text-destructive"}
        />
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Pagos vs. Disponible</span>
          <span>{consumedPct}% consumido</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              alcanza ? "bg-primary" : "bg-destructive"
            )}
            style={{ width: `${consumedPct}%` }}
          />
        </div>
      </div>

      {/* ── Consolidation toggle ── */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <Repeat2 className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Consolidar pagos vía Banesco
                </p>
                <p className="text-xs text-muted-foreground">
                  Pagar Smartcash y Graciela a través de Banesco
                </p>
              </div>
            </div>
            <Button
              variant={consolidar ? "default" : "outline"}
              size="sm"
              onClick={() => setConsolidar(!consolidar)}
            >
              {consolidar ? "✓ Activado" : "Desactivado"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Timeline table ── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cronograma de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs w-10">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                    Corte
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                    Sugerido
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                    Tarjeta
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">
                    Saldo
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <Shield className="h-3 w-3" />
                      Seguro
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">
                    Pago
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Starting balance row */}
                <tr className="border-b border-border bg-accent/20">
                  <td
                    colSpan={7}
                    className="px-4 py-2.5 font-medium text-muted-foreground text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5" />
                      Saldo Disponible Inicial
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-sky-400">
                    {formatCurrency(disponible)}
                  </td>
                </tr>

                {/* Card payment rows */}
                {timeline.map((t, i) => {
                  const paymentNum = t.consolidado
                    ? "—"
                    : String(
                        timeline
                          .slice(0, i + 1)
                          .filter((x) => !x.consolidado).length
                      );

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        (t.consolidado || t.yaPagado)
                          ? "opacity-40"
                          : "hover:bg-accent/30",
                        !t.consolidado &&
                          t.balanceDespues < 0 &&
                          "bg-destructive/5"
                      )}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {paymentNum}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className="text-xs tabular-nums font-mono border-destructive/20 text-destructive"
                        >
                          Día {t.fecha_corte}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="secondary"
                          className="text-xs tabular-nums font-mono bg-sky-500/10 text-sky-500 hover:bg-sky-500/20"
                        >
                          {t.fecha_sugerida.toLocaleDateString("es-PA", { day: "2-digit", month: "short" })}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <div>
                            <span
                              className={cn(
                                "font-medium",
                                (t.consolidado || t.yaPagado) && "line-through"
                              )}
                            >
                              {t.nombre}
                            </span>
                            {t.yaPagado && !t.consolidado && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] ml-2 text-positive border-positive/20"
                              >
                                ✓ Pagado
                              </Badge>
                            )}
                            {t.consolidado && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] ml-2"
                              >
                                {t.postergado ? "vía Banesco (Próx. Mes)" : "vía Banesco"}
                              </Badge>
                            )}
                            {t.incluyeConsolidados &&
                              t.incluyeConsolidados.length > 0 && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Incluye:{" "}
                                  {t.incluyeConsolidados
                                    .map(
                                      (c) =>
                                        `${c.nombre.split(" - ")[1] || c.nombre} (${formatCurrency(c.saldo)})`
                                    )
                                    .join(" + ")}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {t.consolidado ? (
                          <span className="text-muted-foreground">{formatCurrency(t.saldo)}</span>
                        ) : (
                          <Input
                            type="number"
                            value={tarjetas.find(card => card.id === t.id)?.saldo || 0}
                            onChange={(e) => updateSaldo(t.id, parseFloat(e.target.value) || 0)}
                            className="h-7 w-24 text-right text-sm tabular-nums ml-auto"
                            step="0.01"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-amber-400/80">
                        {formatCurrency(t.seguro)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right tabular-nums font-medium",
                          t.consolidado
                            ? "text-muted-foreground"
                            : "text-destructive"
                        )}
                      >
                        {t.consolidado ? "—" : formatCurrency(t.cashPayment)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right tabular-nums font-semibold",
                          t.consolidado
                            ? "text-muted-foreground"
                            : t.balanceDespues >= 0
                              ? "text-foreground"
                              : "text-destructive"
                        )}
                      >
                        {t.consolidado
                          ? "—"
                          : formatCurrency(t.balanceDespues)}
                        {!t.consolidado && t.balanceDespues < 0 && (
                          <span className="ml-1">❌</span>
                        )}
                        {!t.consolidado &&
                          t.balanceDespues >= 0 &&
                          i ===
                            timeline.filter((x) => !x.consolidado).length -
                              1 +
                              timeline.filter((x) => x.consolidado).length && (
                          <span className="ml-1">✅</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals / Final row */}
                <tr className="bg-accent/20">
                  <td
                    colSpan={4}
                    className="px-4 py-3 font-semibold text-sm"
                  >
                    Totales
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-sm">
                    {formatCurrency(totalSaldos)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-sm text-amber-400">
                    {formatCurrency(totalSeguros)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-sm">
                    <span className="block">{formatCurrency(totalPagos)}</span>
                    <span className="block text-[10px] text-muted-foreground font-normal whitespace-nowrap">Pendiente por Pagar</span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums font-bold text-base",
                      balanceFinal >= 0 ? "text-positive" : "text-destructive"
                    )}
                  >
                    {formatCurrency(balanceFinal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Insurance breakdown ── */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-amber-400" />
            Detalle de Seguros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tarjetas.map((t) => {
              const seguro = calcularSeguro(
                t.seguro_tipo,
                t.seguro_params,
                t.saldo,
                diasMes
              );
              const formulaLabel =
                t.seguro_tipo === "smartcash"
                  ? t.saldo <= t.seguro_params.umbral
                    ? "Tarifa fija"
                    : "0.25% + ITBMS"
                  : t.seguro_tipo === "por_millar_fraccion"
                    ? `${Math.ceil(t.saldo / 1000)} × B/. ${t.seguro_params.costo_por_millar}`
                    : `B/. ${t.seguro_params.costo_por_millar}/millar × ${diasMes}d`;

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: CARD_COLORS[t.id] || "#6b7280",
                      }}
                    />
                    <span className="text-muted-foreground">{t.nombre}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ({formulaLabel})
                    </span>
                  </div>
                  <span className="tabular-nums text-amber-400">
                    {formatCurrency(seguro)}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-medium text-sm">Total Seguros</span>
              <span className="tabular-nums font-semibold text-amber-400">
                {formatCurrency(totalSeguros)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Source accounts ── */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowCuentas(!showCuentas)}
          >
            <CardTitle className="text-sm">
              Cuentas disponibles ({cuentasDisponible.length})
            </CardTitle>
            {showCuentas ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showCuentas && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {cuentasDisponible.map((c) => (
                <div
                  key={c.nombre}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{c.nombre}</span>
                  <span className="tabular-nums">{formatCurrency(c.valor)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium">Total Disponible</span>
                <span className="tabular-nums font-semibold text-sky-400">
                  {formatCurrency(disponible)}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
