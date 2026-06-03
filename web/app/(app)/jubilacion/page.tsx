"use client";

import { useEffect, useState } from "react";
import { JubilacionClient } from "./jubilacion-client";
import { getNetWorthDB, getPerfil } from "@/lib/data";
import type { NetWorthRecord, PerfilConfig } from "@/types";

const DEFAULT_PERFIL: PerfilConfig = {
  nombre: "Usuario",
  moneda: "B/.",
  locale: "es-PA",
  anio_nacimiento: 1990,
  jubilacion_defaults: {
    edad_retiro: 65,
    aporte_mensual: 500,
    aumento_anual: 3,
    retorno_anual: 7,
    meta_balance: 500000,
    pension_mensual: 800,
  },
};

export default function JubilacionPage() {
  const [historial, setHistorial] = useState<NetWorthRecord[]>([]);
  const [perfil, setPerfil] = useState<PerfilConfig>(DEFAULT_PERFIL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [h, p] = await Promise.all([getNetWorthDB(), getPerfil()]);
        setHistorial(h);
        setPerfil(p);
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

  return <JubilacionClient historial={historial} perfil={perfil} />;
}
