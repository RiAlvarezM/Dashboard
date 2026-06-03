import { getBudget } from "@/lib/data";
import { PresupuestoClient } from "./presupuesto-client";

export default async function PresupuestoPage() {
  const budget = await getBudget();
  return <PresupuestoClient initialBudget={budget} />;
}
