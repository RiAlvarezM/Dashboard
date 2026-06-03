"use client";

import { useState } from "react";
import type { AmortizacionRecord, PrestamosData, Prestamo } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Save, Home, Percent, TrendingDown, Clock, Plus } from "lucide-react";

interface Props {
  initialData: PrestamosData;
}

function parseCurrency(val: string | undefined): number {
  if (!val || val.trim() === "") return 0;
  const cleaned = val.replace(/[^-0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function PrestamosClient({ initialData }: Props) {
  const [data, setData] = useState<PrestamosData>(initialData);
  const [selectedId, setSelectedId] = useState<string>(
    initialData.prestamos.length > 0 ? initialData.prestamos[0].id : ""
  );
  
  const [importText, setImportText] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPrestamo = data.prestamos.find((p) => p.id === selectedId) || null;
  const amortizacion = selectedPrestamo?.amortizacion || [];

  const handleImport = () => {
    const lines = importText.split("\n").filter((l) => l.trim() !== "");
    const records: AmortizacionRecord[] = [];

    let lastAno = 0;

    // Skip headers (we assume the user pastes the header row or just the data rows)
    for (const line of lines) {
      const cols = line.split("\t").map((c) => c.trim());
      
      const parsedAno = parseInt(cols[0]);
      if (!isNaN(parsedAno)) {
        lastAno = parsedAno;
      }
      
      // Look for rows that have at least 15 columns and start with a number (Año) or empty
      // Sometimes "Año" is empty if it's the same year
      const rawMes = cols[1] || "";
      const rawNum = cols[2] || "";
      
      // If payment number isn't a valid integer > 0, it might be a header or a summary row
      const pagoNum = parseInt(rawNum);
      if (isNaN(pagoNum) || pagoNum <= 0) continue;

      const record: AmortizacionRecord = {
        ano: lastAno,
        mes: rawMes,
        pago_num: pagoNum,
        neto: parseCurrency(cols[3]),
        total: parseCurrency(cols[4]),
        capital: parseCurrency(cols[5]),
        extra: parseCurrency(cols[6]),
        interes: parseCurrency(cols[7]),
        mantenimiento: parseCurrency(cols[8]),
        feci: parseCurrency(cols[9]),
        gastos: parseCurrency(cols[10]),
        alquiler: parseCurrency(cols[11]),
        balance: parseCurrency(cols[12]),
        balance_teorico: parseCurrency(cols[13]),
        capital_acum: parseCurrency(cols[16] || cols[15]), // Depending on empty columns in the middle
        interes_acum: parseCurrency(cols[17] || cols[16]),
        pagado_total: parseCurrency(cols[18] || cols[17]),
        porcentaje: parseCurrency(cols[19] || cols[18]),
        notas: cols[20] || cols[19] || "",
      };
      
      records.push(record);
    }

    if (records.length > 0 && selectedId) {
      setData((prev) => ({
        prestamos: prev.prestamos.map((p) => 
          p.id === selectedId ? { ...p, amortizacion: records } : p
        )
      }));
      setIsImportOpen(false);
      setImportText("");
    } else if (!selectedId) {
      alert("Selecciona un préstamo primero.");
    } else {
      alert("No se encontraron filas válidas.");
    }
  };

  const handleAddPrestamo = () => {
    const id = `prestamo-${Date.now()}`;
    setData((prev) => ({
      prestamos: [...prev.prestamos, { id, nombre: "Nuevo Préstamo", tipo: "hipoteca", amortizacion: [] }]
    }));
    setSelectedId(id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/prestamos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      alert("Datos de préstamos guardados exitosamente.");
    } catch (error) {
      console.error("Error saving prestamos", error);
      alert("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Summaries
  const currentRecord = amortizacion.length > 0 ? amortizacion.find(r => r.balance > 0 && r.pago_num === Math.max(...amortizacion.filter(x => x.balance > 0).map(y => y.pago_num))) || amortizacion[amortizacion.length - 1] : null;
  
  const totalCapitalPaid = currentRecord ? currentRecord.capital_acum : 0;
  const currentBalance = currentRecord ? currentRecord.balance : 0;
  const progressPct = currentRecord ? currentRecord.porcentaje : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Préstamos y Amortizaciones"
        description="Seguimiento de hipotecas y préstamos personales"
      >
        <div className="flex items-center gap-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar Préstamo" />
            </SelectTrigger>
            <SelectContent>
              {data.prestamos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleAddPrestamo}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{selectedPrestamo?.nombre || "Ningún préstamo seleccionado"}</h3>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!selectedId}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Importar a {selectedPrestamo?.nombre}</DialogTitle>
                <DialogDescription>
                  Copia las filas desde tu Excel y pégalas aquí.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega aquí los datos de Excel (separados por tabulaciones)..."
                  className="font-mono text-xs h-[300px]"
                />
                <Button onClick={handleImport} className="w-full">
                  Procesar y Previsualizar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={saving || !selectedId} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Balance Actual"
          value={formatCurrency(currentBalance)}
          subValue="Capital pendiente"
          valueClassName="text-destructive"
        />
        <StatCard
          label="Capital Pagado"
          value={formatCurrency(totalCapitalPaid)}
          subValue="Acumulado a la fecha"
          valueClassName="text-positive"
        />
        <StatCard
          label="Progreso"
          value={`${formatNumber(progressPct)}%`}
          subValue="Deuda saldada"
          valueClassName="text-amber-400"
        />
        <StatCard
          label="Próximo Pago"
          value={currentRecord ? formatCurrency(currentRecord.total) : "0"}
          subValue={currentRecord ? currentRecord.mes : ""}
          valueClassName="text-sky-400"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            Tabla de Amortización ({amortizacion.length} meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-card z-10 shadow-sm">
                <tr className="border-b border-border/50">
                  <th className="px-3 py-2 font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">Mes</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right">Cuota Total</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right">A Capital</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right text-positive">Abono Extra</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right text-amber-500">Interés</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right">Balance</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground text-right text-sky-400">%</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {amortizacion.map((row, idx) => (
                  <tr key={idx} className={`hover:bg-muted/50 transition-colors ${row.balance <= 0 ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-2 text-muted-foreground">{row.pago_num}</td>
                    <td className="px-3 py-2 font-medium">{row.mes}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.capital)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-positive font-medium">
                      {row.extra > 0 ? formatCurrency(row.extra) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber-500/80">{formatCurrency(row.interes)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatCurrency(row.balance)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sky-400">{formatNumber(row.porcentaje)}%</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground max-w-[200px] truncate" title={row.notas}>
                      {row.notas}
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
