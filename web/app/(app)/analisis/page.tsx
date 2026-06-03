"use client";

import { useEffect, useState } from "react";
import { AnalisisClient } from "./analisis-client";
import { getNetWorthDB } from "@/lib/data";
import type { NetWorthRecord } from "@/types";

export default function AnalisisPage() {
  const [historial, setHistorial] = useState<NetWorthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getNetWorthDB();
        setHistorial(data);
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

  return <AnalisisClient historial={historial} />;
}
