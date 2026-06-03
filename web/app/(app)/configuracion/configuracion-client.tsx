"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cuenta, TarjetasData, TarjetaConfig, PuntosData, PuntoConfig, PerfilConfig, Vehiculo, Propiedad } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Plus, User, Car, Home } from "lucide-react";

interface Props {
  initialCuentas: Cuenta[];
  initialTarjetasData: TarjetasData;
  initialPuntosConfig: PuntosData;
  initialPerfil: PerfilConfig;
  initialVehiculos: Vehiculo[];
  initialPropiedades: Propiedad[];
}

const CATEGORIAS = ["Ahorro", "Inversion", "Jubilacion", "Deuda", "Prestamo"] as const;
const CATEGORIA_LABELS: Record<string, string> = {
  Ahorro: "Ahorro",
  Inversion: "Inversión",
  Jubilacion: "Jubilación",
  Deuda: "Deuda",
  Prestamo: "Préstamos",
};

export function ConfiguracionClient({ initialCuentas, initialTarjetasData, initialPuntosConfig, initialPerfil, initialVehiculos, initialPropiedades }: Props) {
  const router = useRouter();
  const [cuentas, setCuentas] = useState(initialCuentas);
  const [tarjetasData, setTarjetasData] = useState(initialTarjetasData);
  const [puntosConfig, setPuntosConfig] = useState(initialPuntosConfig);
  const [perfil, setPerfil] = useState(initialPerfil);
  const [vehiculos, setVehiculos] = useState(initialVehiculos);
  const [propiedades, setPropiedades] = useState(initialPropiedades);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await import("@/lib/data").then(m => m.supabase.auth.getSession());
      const token = session?.access_token;

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const responses = await Promise.all([
        fetch("/api/cuentas", { method: "PUT", headers, body: JSON.stringify(cuentas) }),
        fetch("/api/tarjetas", { method: "PUT", headers, body: JSON.stringify(tarjetasData) }),
        fetch("/api/puntos-config", { method: "PUT", headers, body: JSON.stringify(puntosConfig) }),
        fetch("/api/perfil", { method: "PUT", headers, body: JSON.stringify(perfil) }),
        fetch("/api/vehiculos", { method: "PUT", headers, body: JSON.stringify(vehiculos) }),
        fetch("/api/propiedades", { method: "PUT", headers, body: JSON.stringify(propiedades) }),
      ]);

      for (const res of responses) {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Error: ${res.status}`);
        }
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setError(msg);
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateCuenta = (idx: number, field: keyof Cuenta, value: unknown) => {
    setCuentas((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const deleteCuenta = (idx: number) => setCuentas((prev) => prev.filter((_, i) => i !== idx));

  const addCuenta = (cat: string) => {
    const newCuenta: Cuenta = {
      Categoria: cat as Cuenta["Categoria"],
      Nombre_Cuenta: "Nueva Cuenta",
      Monto_Objetivo: 0,
      Incluir: true,
      Ultimo_Valor: 0,
    };
    setCuentas((prev) => [...prev, newCuenta]);
  };

  const updateTarjeta = (idx: number, field: keyof TarjetaConfig, value: unknown) => {
    setTarjetasData((prev) => ({
      ...prev,
      tarjetas: prev.tarjetas.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    }));
  };

  const deleteTarjeta = (idx: number) => {
    setTarjetasData((prev) => ({
      ...prev,
      tarjetas: prev.tarjetas.filter((_, i) => i !== idx),
    }));
  };

  const addTarjeta = () => {
    const newTarjeta: TarjetaConfig = {
      id: `tarjeta-${Date.now()}`,
      nombre: "Nueva Tarjeta",
      cuenta_ref: "",
      fecha_corte: 1,
      tipo: "tarjeta",
      seguro_tipo: "por_millar_diario",
      seguro_params: { costo_por_millar: 0 },
      pagable_via_banesco: false,
    };
    setTarjetasData((prev) => ({
      ...prev,
      tarjetas: [...prev.tarjetas, newTarjeta],
    }));
  };

  const updatePuntoConfig = (idx: number, field: keyof PuntoConfig, value: unknown) => {
    setPuntosConfig((prev) => ({
      ...prev,
      categorias: prev.categorias.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const deletePuntoConfig = (idx: number) => {
    setPuntosConfig((prev) => ({
      ...prev,
      categorias: prev.categorias.filter((_, i) => i !== idx),
    }));
  };

  const addPuntoConfig = () => {
    const newPunto: PuntoConfig = {
      id: `punto_${Date.now()}`,
      nombre: "Nuevo Programa",
      color: "#94a3b8",
      equivalencia_dolar: 0.01,
      grupo: puntosConfig.grupos[0]?.nombre || "Otros",
    };
    setPuntosConfig((prev) => ({
      ...prev,
      categorias: [...prev.categorias, newPunto],
    }));
  };

  // --- Vehiculos ---
  const addVehiculo = () => setVehiculos(prev => [...prev, { id: `v-${Date.now()}`, nombre: "Nuevo Vehículo", valor_original: 0, anio_compra: new Date().getFullYear() }]);
  const deleteVehiculo = (idx: number) => setVehiculos(prev => prev.filter((_, i) => i !== idx));
  const updateVehiculo = (idx: number, field: keyof Vehiculo, value: unknown) => setVehiculos(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));

  // --- Propiedades ---
  const addPropiedad = () => setPropiedades(prev => [...prev, { Propiedad: "Nueva Propiedad", Valor_Avaluo: 0, Fecha_Avaluo: new Date().toISOString().split("T")[0] }]);
  const deletePropiedad = (idx: number) => setPropiedades(prev => prev.filter((_, i) => i !== idx));
  const updatePropiedad = (idx: number, field: keyof Propiedad, value: unknown) => setPropiedades(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  return (
    <div>
      <PageHeader title="Configuración" description="Gestión de cuentas y objetivos">
        <div className="flex flex-col items-end gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue="Perfil">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="Perfil">Perfil</TabsTrigger>
          {CATEGORIAS.map((cat) => {
            const count = cuentas.filter((c) => c.Categoria === cat && c.Incluir).length;
            return (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORIA_LABELS[cat]}
                <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">{count}</Badge>
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="Tarjetas">
            Tarjetas
            <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">{tarjetasData.tarjetas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Puntos">
            Puntos
            <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">{puntosConfig.categorias.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Vehiculos">
            Vehículos
            <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">{vehiculos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Propiedades">
            Propiedades
            <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">{propiedades.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {CATEGORIAS.map((cat) => {
          const cuentasCat = cuentas.map((c, i) => ({ ...c, _idx: i })).filter((c) => c.Categoria === cat);
          const total = cuentasCat.filter((c) => c.Incluir).reduce((s, c) => s + c.Ultimo_Valor, 0);
          const objetivo = cuentasCat.filter((c) => c.Incluir).reduce((s, c) => s + c.Monto_Objetivo, 0);

          return (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{CATEGORIA_LABELS[cat]}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: <span className="font-medium text-foreground">{formatCurrency(total)}</span>
                        {objetivo > 0 && <> · Objetivo: <span className="font-medium text-foreground">{formatCurrency(objetivo)}</span></>}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addCuenta(cat)}>
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-3 px-2 text-xs text-muted-foreground font-medium">
                      <div className="col-span-4">Nombre</div>
                      <div className="col-span-3">Último Valor</div>
                      <div className="col-span-3">Objetivo</div>
                      <div className="col-span-1 text-center">Activa</div>
                      <div className="col-span-1" />
                    </div>
                    {cuentasCat.map((cuenta) => (
                      <div
                        key={cuenta._idx}
                        className={`grid grid-cols-12 gap-3 items-center px-2 py-1.5 rounded-lg transition-colors ${cuenta.Incluir ? "" : "opacity-50"}`}
                      >
                        <div className="col-span-4">
                          <Input
                            value={cuenta.Nombre_Cuenta}
                            onChange={(e) => updateCuenta(cuenta._idx, "Nombre_Cuenta", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={cuenta.Ultimo_Valor}
                            onChange={(e) => updateCuenta(cuenta._idx, "Ultimo_Valor", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm tabular-nums"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={cuenta.Monto_Objetivo}
                            onChange={(e) => updateCuenta(cuenta._idx, "Monto_Objetivo", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm tabular-nums"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={cuenta.Incluir}
                            onChange={(e) => updateCuenta(cuenta._idx, "Incluir", e.target.checked)}
                            className="h-4 w-4 accent-primary cursor-pointer"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteCuenta(cuenta._idx)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
        <TabsContent value="Tarjetas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tarjetas de Crédito y Servicios</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Configuración de fechas de corte y seguros</p>
                </div>
                <Button variant="outline" size="sm" onClick={addTarjeta}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tarjetasData.tarjetas.map((tarjeta, idx) => (
                  <div key={tarjeta.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={tarjeta.nombre}
                        onChange={(e) => updateTarjeta(idx, "nombre", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    {tarjeta.tipo === "servicio" ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Saldo Inicial / Monto</Label>
                        <Input
                          type="number"
                          value={tarjeta.saldo || 0}
                          onChange={(e) => updateTarjeta(idx, "saldo", parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm tabular-nums"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">Cuenta de Referencia</Label>
                        <Input
                          value={tarjeta.cuenta_ref}
                          onChange={(e) => updateTarjeta(idx, "cuenta_ref", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={tarjeta.tipo || "tarjeta"} onValueChange={(val: any) => updateTarjeta(idx, "tipo", val)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="servicio">Servicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Fecha de Corte</Label>
                      <Input
                        type="number"
                        value={tarjeta.fecha_corte}
                        onChange={(e) => updateTarjeta(idx, "fecha_corte", parseInt(e.target.value) || 1)}
                        className="h-8 text-sm"
                        min="1" max="31"
                      />
                    </div>
                    <div className="flex items-center justify-between col-span-1 md:col-span-2 pt-2 border-t mt-2">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tarjeta.pagable_via_banesco}
                          onChange={(e) => updateTarjeta(idx, "pagable_via_banesco", e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Pagable vía Banesco
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => deleteTarjeta(idx)} className="text-destructive h-8 px-2 hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Perfil">
          <Card>
            <CardHeader><CardTitle>Perfil de Usuario</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={perfil.nombre} onChange={(e) => setPerfil(p => ({ ...p, nombre: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Moneda</Label>
                  <Select value={perfil.moneda} onValueChange={(v) => setPerfil(p => ({ ...p, moneda: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B/.">B/. (Balboa)</SelectItem>
                      <SelectItem value="$">$ (Dólar)</SelectItem>
                      <SelectItem value="€">€ (Euro)</SelectItem>
                      <SelectItem value="MXN$">MXN$ (Peso MX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Año de Nacimiento</Label>
                  <Input type="number" value={perfil.anio_nacimiento} onChange={(e) => setPerfil(p => ({ ...p, anio_nacimiento: parseInt(e.target.value) || 1990 }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Locale</Label>
                  <Select value={perfil.locale} onValueChange={(v) => setPerfil(p => ({ ...p, locale: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-PA">es-PA</SelectItem>
                      <SelectItem value="es-MX">es-MX</SelectItem>
                      <SelectItem value="es-ES">es-ES</SelectItem>
                      <SelectItem value="en-US">en-US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Valores por Defecto — Jubilación</p>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    ["edad_retiro", "Edad de Retiro", 1],
                    ["aporte_mensual", "Aporte Mensual", 10],
                    ["aumento_anual", "Aumento Anual (%)", 0.5],
                    ["retorno_anual", "Retorno Anual (%)", 0.5],
                    ["meta_balance", "Meta de Balance", 1000],
                    ["pension_mensual", "Pensión Mensual", 50],
                  ] as const).map(([key, label, step]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs">{label}</Label>
                      <Input type="number" step={step} value={perfil.jubilacion_defaults[key]} onChange={(e) => setPerfil(p => ({ ...p, jubilacion_defaults: { ...p.jubilacion_defaults, [key]: parseFloat(e.target.value) || 0 } }))} className="h-8 text-sm tabular-nums" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Puntos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programas de Puntos y Millas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Equivalencias, colores y agrupación para gráficas</p>
                </div>
                <Button variant="outline" size="sm" onClick={addPuntoConfig}>
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {puntosConfig.categorias.map((punto, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-card/50 items-center">
                    <div className="space-y-2">
                      <Label className="text-xs">ID</Label>
                      <Input value={punto.id} onChange={(e) => updatePuntoConfig(idx, "id", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre</Label>
                      <Input value={punto.nombre} onChange={(e) => updatePuntoConfig(idx, "nombre", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input type="color" value={punto.color} onChange={(e) => updatePuntoConfig(idx, "color", e.target.value)} className="h-8 w-12 p-1" />
                        <Input value={punto.color} onChange={(e) => updatePuntoConfig(idx, "color", e.target.value)} className="h-8 text-sm flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Grupo</Label>
                      <Select value={punto.grupo || "Otros"} onValueChange={(v) => updatePuntoConfig(idx, "grupo", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {puntosConfig.grupos.map(g => <SelectItem key={g.nombre} value={g.nombre}>{g.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Eq. $ (1pt=X$)</Label>
                      <div className="flex gap-2 items-center">
                        <Input type="number" value={punto.equivalencia_dolar} onChange={(e) => updatePuntoConfig(idx, "equivalencia_dolar", parseFloat(e.target.value) || 0)} className="h-8 text-sm tabular-nums" step="0.0001" />
                        <Button variant="ghost" size="icon-sm" onClick={() => deletePuntoConfig(idx)} className="text-destructive hover:bg-destructive/10 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Vehiculos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vehículos</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Se deprecian automáticamente para el cálculo de patrimonio</p>
                </div>
                <Button variant="outline" size="sm" onClick={addVehiculo}><Plus className="h-3.5 w-3.5" /> Agregar</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 px-2 text-xs text-muted-foreground font-medium">
                  <div className="col-span-4">Nombre</div>
                  <div className="col-span-3">Valor Original</div>
                  <div className="col-span-2">Año Compra</div>
                  <div className="col-span-2">Depr. Anual %</div>
                  <div className="col-span-1" />
                </div>
                {vehiculos.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-12 gap-3 items-center px-2 py-1.5 rounded-lg">
                    <div className="col-span-4"><Input value={v.nombre} onChange={(e) => updateVehiculo(idx, "nombre", e.target.value)} className="h-8 text-sm" /></div>
                    <div className="col-span-3"><Input type="number" value={v.valor_original} onChange={(e) => updateVehiculo(idx, "valor_original", parseFloat(e.target.value) || 0)} className="h-8 text-sm tabular-nums" /></div>
                    <div className="col-span-2"><Input type="number" value={v.anio_compra} onChange={(e) => updateVehiculo(idx, "anio_compra", parseInt(e.target.value) || 2020)} className="h-8 text-sm" /></div>
                    <div className="col-span-2"><Input type="number" value={(v.tasa_depreciacion ?? 0.2) * 100} onChange={(e) => updateVehiculo(idx, "tasa_depreciacion", (parseFloat(e.target.value) || 20) / 100)} className="h-8 text-sm tabular-nums" step="1" /></div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteVehiculo(idx)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Propiedades">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Propiedades</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Bienes raíces incluidos en el patrimonio</p>
                </div>
                <Button variant="outline" size="sm" onClick={addPropiedad}><Plus className="h-3.5 w-3.5" /> Agregar</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 px-2 text-xs text-muted-foreground font-medium">
                  <div className="col-span-5">Nombre</div>
                  <div className="col-span-3">Valor Avalúo</div>
                  <div className="col-span-3">Fecha Avalúo</div>
                  <div className="col-span-1" />
                </div>
                {propiedades.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center px-2 py-1.5 rounded-lg">
                    <div className="col-span-5"><Input value={p.Propiedad} onChange={(e) => updatePropiedad(idx, "Propiedad", e.target.value)} className="h-8 text-sm" /></div>
                    <div className="col-span-3"><Input type="number" value={p.Valor_Avaluo} onChange={(e) => updatePropiedad(idx, "Valor_Avaluo", parseFloat(e.target.value) || 0)} className="h-8 text-sm tabular-nums" /></div>
                    <div className="col-span-3"><Input type="date" value={p.Fecha_Avaluo} onChange={(e) => updatePropiedad(idx, "Fecha_Avaluo", e.target.value)} className="h-8 text-sm" /></div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon-sm" onClick={() => deletePropiedad(idx)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
