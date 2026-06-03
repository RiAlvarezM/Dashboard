import { getNetWorthDB, getPerfil } from "@/lib/data";
import { JubilacionClient } from "./jubilacion-client";

export default async function JubilacionPage() {
  const [historial, perfil] = await Promise.all([
    getNetWorthDB(),
    getPerfil(),
  ]);
  return <JubilacionClient historial={historial} perfil={perfil} />;
}
