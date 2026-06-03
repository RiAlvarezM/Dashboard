import { getCuentas, getTarjetas, getPuntosConfig, getPerfil, getVehiculos, getPropiedades } from "@/lib/data";
import { ConfiguracionClient } from "./configuracion-client";

export default async function ConfiguracionPage() {
  const [cuentas, tarjetasData, puntosConfig, perfil, vehiculos, propiedades] = await Promise.all([
    getCuentas(),
    getTarjetas(),
    getPuntosConfig(),
    getPerfil(),
    getVehiculos(),
    getPropiedades(),
  ]);
  return (
    <ConfiguracionClient
      initialCuentas={cuentas}
      initialTarjetasData={tarjetasData}
      initialPuntosConfig={puntosConfig}
      initialPerfil={perfil}
      initialVehiculos={vehiculos}
      initialPropiedades={propiedades}
    />
  );
}
