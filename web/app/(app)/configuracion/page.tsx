"use client";

import { useEffect, useState } from "react";
import { getCuentas, getTarjetas, getPuntosConfig, getPerfil, getVehiculos, getPropiedades } from "@/lib/data";
import { ConfiguracionClient } from "./configuracion-client";
import type { Cuenta, TarjetasData, PuntosData, PerfilConfig, Vehiculo, Propiedad } from "@/types";

export default function ConfiguracionPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetasData, setTarjetasData] = useState<TarjetasData>({ tarjetas: [], fuentes_disponible: { categorias: [], cuentas_extra: [] } });
  const [puntosConfig, setPuntosConfig] = useState<PuntosData>({ categorias: [], grupos: [] });
  const [perfil, setPerfil] = useState<PerfilConfig | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, t, pc, pf, v, pr] = await Promise.all([
          getCuentas(),
          getTarjetas(),
          getPuntosConfig(),
          getPerfil(),
          getVehiculos(),
          getPropiedades(),
        ]);
        setCuentas(c);
        setTarjetasData(t);
        setPuntosConfig(pc);
        setPerfil(pf);
        setVehiculos(v);
        setPropiedades(pr);
      } catch (error) {
        console.error("Error loading configuration:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !perfil) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfiguracionClient
      initialCuentas={cuentas}
      initialTarjetasData={tarjetasData}
      initialPuntosConfig={puntosConfig}
      initialPerfil={perfil}
      initialVehiculos={vehiculos}
      initialPropiedades={propiedades}
    />
  );
}
