import { getPuntos, getPuntosConfig } from "@/lib/data";
import { PuntosClient } from "./puntos-client";

export default async function PuntosPage() {
  const [puntos, config] = await Promise.all([
    getPuntos(),
    getPuntosConfig(),
  ]);
  return <PuntosClient initialPuntos={puntos} config={config} />;
}
