"use client";

import { useEffect, useState } from "react";
import { getCuentas, getTarjetas } from "@/lib/data";
import { FlujoMensualClient } from "./flujo-mensual-client";
import type { Cuenta, TarjetaConfig } from "@/types";

export default function FlujoMensualPage() {
  const [tarjetas, setTarjetas] = useState<(TarjetaConfig & { saldo: number })[]>([]);
  const [disponible, setDisponible] = useState(0);
  const [cuentasDisponible, setCuentasDisponible] = useState<{ nombre: string; valor: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cuentas, tarjetasConfig] = await Promise.all([
          getCuentas(),
          getTarjetas(),
        ]);

        const { fuentes_disponible } = tarjetasConfig;

        const isSourceAccount = (c: Cuenta) =>
          c.Incluir &&
          (fuentes_disponible.categorias.includes(c.Categoria) ||
            fuentes_disponible.cuentas_extra.includes(c.Nombre_Cuenta));

        const disponibleAmount = cuentas.filter(isSourceAccount).reduce((s, c) => s + c.Ultimo_Valor, 0);

        const cuentasDisponibleList = cuentas
          .filter(isSourceAccount)
          .map((c) => ({ nombre: c.Nombre_Cuenta, valor: c.Ultimo_Valor }))
          .filter((c) => c.valor > 0)
          .sort((a, b) => b.valor - a.valor);

        const tarjetasWithSaldo = tarjetasConfig.tarjetas.map((t) => ({
          ...t,
          saldo: cuentas.find((c) => c.Nombre_Cuenta === t.cuenta_ref)?.Ultimo_Valor ?? 0,
        }));

        setTarjetas(tarjetasWithSaldo);
        setDisponible(disponibleAmount);
        setCuentasDisponible(cuentasDisponibleList);
      } catch (error) {
        console.error("Error loading flujo mensual:", error);
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
          <p className="mt-4 text-muted-foreground">Cargando flujo mensual...</p>
        </div>
      </div>
    );
  }

  return (
    <FlujoMensualClient
      tarjetas={tarjetas}
      disponible={disponible}
      cuentasDisponible={cuentasDisponible}
    />
  );
}
