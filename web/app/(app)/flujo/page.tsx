"use client";

import { useEffect, useState } from "react";
import { FlujoClient } from "./flujo-client";
import { getFlows } from "@/lib/data";
import type { Flow } from "@/types";

export default function FlujoPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFlows();
        setFlows(data);
      } catch (error) {
        console.error("Error loading flows:", error);
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

  return <FlujoClient initialFlows={flows} year={new Date().getFullYear()} />;
}
