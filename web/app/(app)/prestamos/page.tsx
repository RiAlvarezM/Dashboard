"use client";

import { useEffect, useState } from "react";
import { PrestamosClient } from "./prestamos-client";
import { getPrestamos } from "@/lib/data";
import type { PrestamosData } from "@/types";

const EMPTY: PrestamosData = { prestamos: [] };

export default function PrestamosPage() {
  const [data, setData] = useState<PrestamosData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const prestamosData = await getPrestamos();
        setData(prestamosData);
      } catch (error) {
        console.error("Error loading prestamos:", error);
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

  return <PrestamosClient initialData={data} />;
}
