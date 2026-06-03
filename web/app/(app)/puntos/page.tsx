"use client";

import { useEffect, useState } from "react";
import { PuntosClient } from "./puntos-client";
import { getPuntos, getPuntosConfig } from "@/lib/data";
import type { PuntosRecord, PuntosData } from "@/types";

const DEFAULT_CONFIG: PuntosData = {
  categorias: [],
  grupos: [],
};

export default function PuntosPage() {
  const [puntos, setPuntos] = useState<PuntosRecord[]>([]);
  const [config, setConfig] = useState<PuntosData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c] = await Promise.all([getPuntos(), getPuntosConfig()]);
        setPuntos(p);
        setConfig(c);
      } catch (error) {
        console.error("Error loading puntos:", error);
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

  return <PuntosClient initialPuntos={puntos} config={config} />;
}
