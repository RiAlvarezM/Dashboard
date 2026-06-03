import { getCuentas, getNetWorthDB, getPropiedades, getVehiculos } from "@/lib/data";
import { calcularAutomovilesFromList, calcularPropiedades } from "@/lib/calculations";
import { PatrimonioClient } from "./patrimonio-client";

export default async function PatrimonioPage() {
  const [cuentas, historial, propiedades, vehiculos] = await Promise.all([
    getCuentas(),
    getNetWorthDB(),
    getPropiedades(),
    getVehiculos(),
  ]);
  const automoviles = calcularAutomovilesFromList(vehiculos);
  const propiedadesVal = calcularPropiedades(propiedades);

  const lastValues: Record<string, number> = {};
  cuentas.forEach((c) => {
    lastValues[c.Nombre_Cuenta] = c.Ultimo_Valor;
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <PatrimonioClient
      cuentas={cuentas}
      historial={historial}
      propiedades={propiedades}
      propiedadesVal={propiedadesVal}
      automoviles={automoviles}
      lastValues={lastValues}
      today={today}
    />
  );
}
