import { getNetWorthDB } from "@/lib/data";
import { AnalisisClient } from "./analisis-client";

export default async function AnalisisPage() {
  const historial = await getNetWorthDB();
  return <AnalisisClient historial={historial} />;
}
