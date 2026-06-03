import { getPrestamos } from "@/lib/data";
import { PrestamosClient } from "./prestamos-client";

export default async function PrestamosPage() {
  const data = await getPrestamos();
  return <PrestamosClient initialData={data} />;
}
