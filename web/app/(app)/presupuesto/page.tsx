"use client";

import { useEffect, useState } from "react";
import { PresupuestoClient } from "./presupuesto-client";
import { getBudget } from "@/lib/data";
import type { Budget } from "@/types";

export default function PresupuestoPage() {
  const [budget, setBudget] = useState<Budget>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getBudget();
        setBudget(data);
      } catch (error) {
        console.error("Error loading budget:", error);
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

  return <PresupuestoClient initialBudget={budget} />;
}
