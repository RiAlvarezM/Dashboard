"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">Año {label}</p>
      {payload.map((p: any) => (
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

function InteresCompuesto() {
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [years, setYears] = useState(15);

  const data = useMemo(() => {
    let balance = initialInvestment;
    let totalInvested = initialInvestment;
    const r = annualReturn / 100 / 12; // Tasa mensual

    const result = [{
      year: 0,
      "Total Invertido": totalInvested,
      "Interés Ganado": 0,
      balance: balance,
    }];

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        balance = balance * (1 + r) + monthlyContribution;
        totalInvested += monthlyContribution;
      }
      result.push({
        year: y,
        "Total Invertido": Math.round(totalInvested),
        "Interés Ganado": Math.round(balance - totalInvested),
        balance: Math.round(balance),
      });
    }

    return result;
  }, [initialInvestment, monthlyContribution, annualReturn, years]);

  const finalBalance = data[data.length - 1].balance;
  const finalInvested = data[data.length - 1]["Total Invertido"];

  return (
    <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Variables</CardTitle>
          <CardDescription>Ajusta los aportes y rendimientos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Inversión Inicial (B/.)</Label>
            <Input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(Number(e.target.value) || 0)} className="mt-1" />
            <input type="range" min="0" max="100000" step="1000" value={initialInvestment} onChange={(e) => setInitialInvestment(Number(e.target.value))} className="w-full mt-3 accent-primary" />
          </div>
          <div>
            <Label>Aporte Mensual (B/.)</Label>
            <Input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)} className="mt-1" />
            <input type="range" min="0" max="5000" step="50" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="w-full mt-3 accent-primary" />
          </div>
          <div>
            <Label>Retorno Anual Estimado (%)</Label>
            <Input type="number" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value) || 0)} className="mt-1" />
            <input type="range" min="1" max="20" step="0.5" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} className="w-full mt-3 accent-primary" />
          </div>
          <div>
            <Label>Años a Invertir</Label>
            <Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value) || 0)} className="mt-1" />
            <input type="range" min="1" max="40" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full mt-3 accent-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle>Proyección del Portafolio</CardTitle>
          <div className="flex gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Balance Final</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(finalBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aportes Propios</p>
              <p className="text-2xl font-semibold text-muted-foreground">{formatCurrency(finalInvested)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222 25% 14%)" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="Total Invertido" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInvested)" />
              <Area type="monotone" dataKey="Interés Ganado" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorInterest)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Simulador simplificado, asumiendo 3 deudas por defecto.
function EstrategiaDeuda() {
  const [extraPayment, setExtraPayment] = useState(200);

  const debtsConst = [
    { name: "Tarjeta de Crédito", balance: 4500, rate: 18, minPayment: 150 },
    { name: "Préstamo Auto", balance: 12000, rate: 8, minPayment: 300 },
    { name: "Préstamo Personal", balance: 6000, rate: 11, minPayment: 200 },
  ];

  // Cálculo rápido: Sin pago extra vs con pago extra. (Avalancha)
  const simulatePayoff = (extra: number) => {
    let months = 0;
    // Copy debts
    let currentDebts = debtsConst.map(d => ({ ...d }));
    // Sort Avalancha: by rate desc
    currentDebts.sort((a, b) => b.rate - a.rate);
    let totalInterestPaid = 0;

    let infiniteLoopControl = 0;
    while (currentDebts.reduce((acc, d) => acc + d.balance, 0) > 0 && infiniteLoopControl < 1200) {
      infiniteLoopControl++;
      months++;
      let extraAvailable = extra;

      // Pagar mínimos primero
      for (let i = 0; i < currentDebts.length; i++) {
        if (currentDebts[i].balance <= 0) continue;

        let interest = currentDebts[i].balance * (currentDebts[i].rate / 100 / 12);
        totalInterestPaid += interest;
        currentDebts[i].balance += interest;

        let payment = Math.min(currentDebts[i].minPayment, currentDebts[i].balance);
        currentDebts[i].balance -= payment;
        
        // Si pagó menos del mínimo porque ya no tenía deuda, el sobrante se va a extraAvailable
        if (currentDebts[i].minPayment > payment) {
          extraAvailable += (currentDebts[i].minPayment - payment);
        }
      }

      // El extra libre se va a la primera deuda no pagada (Avalancha iterando x rate)
      for (let i = 0; i < currentDebts.length; i++) {
        if (extraAvailable <= 0) break;
        if (currentDebts[i].balance > 0) {
          let payment = Math.min(extraAvailable, currentDebts[i].balance);
          currentDebts[i].balance -= payment;
          extraAvailable -= payment;
        }
      }
    }
    return { months, totalInterestPaid };
  };

  const currentResult = simulatePayoff(0);
  const extraResult = simulatePayoff(extraPayment);

  const monthsSaved = currentResult.months - extraResult.months;
  const interestSaved = currentResult.totalInterestPaid - extraResult.totalInterestPaid;

  const data = [
    { name: "Sín Aporte Extra", "Intereses Pagados": Math.round(currentResult.totalInterestPaid) },
    { name: "Con Aporte Extra", "Intereses Pagados": Math.round(extraResult.totalInterestPaid) },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Deudas Iniciales</CardTitle>
          <CardDescription>Uso de estrategia de Avalancha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debtsConst.map((d, i) => (
             <div key={i} className="flex justify-between items-center bg-accent/20 p-3 rounded-lg border border-border">
               <div>
                 <p className="font-medium text-sm">{d.name}</p>
                 <p className="text-xs text-muted-foreground">Tasa: {d.rate}% | Mín: {formatCurrency(d.minPayment)}</p>
               </div>
               <p className="font-bold">{formatCurrency(d.balance)}</p>
             </div>
          ))}

          <div className="pt-4 border-t border-border mt-4">
            <Label className="text-sm font-semibold text-primary">Aporte Extra Mensual (B/.)</Label>
            <Input type="number" value={extraPayment} onChange={(e) => setExtraPayment(Number(e.target.value) || 0)} className="mt-1 bg-primary/10 border-primary/20" />
            <input type="range" min="0" max="2000" step="50" value={extraPayment} onChange={(e) => setExtraPayment(Number(e.target.value))} className="w-full mt-3 accent-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Impacto de Acelerar Pagos</CardTitle>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-muted p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Tiempo Ahorrado</p>
              <p className="text-2xl font-bold text-positive">{Math.floor(monthsSaved / 12)} años, {monthsSaved % 12} meses</p>
              <p className="text-xs text-muted-foreground mt-1">Saldrás en {(extraResult.months/12).toFixed(1)} años en vez de {(currentResult.months/12).toFixed(1)}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Intereses Ahorrados</p>
              <p className="text-2xl font-bold text-positive">{formatCurrency(interestSaved)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[260px] mt-4">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222 25% 14%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
              <Bar dataKey="Intereses Pagados" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SimuladoresPage() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Simuladores (What If)"
        description="Juega con variables y descubre estrategias financieras para alcanzar tus metas más rápido."
      />

      <Tabs defaultValue="inversion" className="w-full">
        <TabsList className="mb-6 bg-card border border-border p-1">
          <TabsTrigger value="inversion" className="px-6">Interés Compuesto</TabsTrigger>
          <TabsTrigger value="deuda" className="px-6">Avalancha de Deuda</TabsTrigger>
        </TabsList>
        <TabsContent value="inversion">
          <InteresCompuesto />
        </TabsContent>
        <TabsContent value="deuda">
          <EstrategiaDeuda />
        </TabsContent>
      </Tabs>
    </div>
  );
}
