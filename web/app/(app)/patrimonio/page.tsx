"use client";

import { useEffect, useState } from "react";
import { PatrimonioClient } from "./patrimonio-client";
import { getCuentas, getNetWorthDB, getPropiedades, getVehiculos } from "@/lib/data";
import { calcularAutomovilesFromList, calcularPropiedades } from "@/lib/calculations";
import type { Cuenta, NetWorthRecord, Propiedad, Vehiculo } from "@/types";

export default function PatrimonioPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [historial, setHistorial] = useState<NetWorthRecord[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadData() {
      try {
        const [c, h, p, v] = await Promise.all([
          getCuentas(),
          getNetWorthDB(),
          getPropiedades(),
          getVehiculos(),
        ]);
        setCuentas(c);
        setHistorial(h);
        setPropiedades(p);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const automoviles = calcularAutomovilesFromList([]);
  const propiedadesVal = calcularPropiedades(propiedades);

  const lastValues: Record<string, number> = {};
  cuentas.forEach((c) => {
    lastValues[c.Nombre_Cuenta] = c.Ultimo_Valor;
  });

  return (
    <PatrimonioClient
      cuentas={cuentas}
      historial={historial}
      propiedades={propiedades}
      propiedadesVal={propiedadesVal}
      automoviles={automoviles}
      lastValues={lastValues}
      today={today}
    />
  );
}
