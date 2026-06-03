import { getCuentas, getTarjetas } from "@/lib/data";
import { FlujoMensualClient } from "./flujo-mensual-client";

export const metadata = {
  title: "Flujo Mensual | Dashboard Financiero",
  description: "Pagos de tarjetas de crédito del mes",
};

export default async function FlujoMensualPage() {
  const [cuentas, tarjetasConfig] = await Promise.all([
    getCuentas(),
    getTarjetas(),
  ]);

  const { fuentes_disponible } = tarjetasConfig;

  const isSourceAccount = (c: { Categoria: string; Nombre_Cuenta: string; Incluir: boolean }) =>
    c.Incluir &&
    (fuentes_disponible.categorias.includes(c.Categoria) ||
      fuentes_disponible.cuentas_extra.includes(c.Nombre_Cuenta));

  const disponible = cuentas.filter(isSourceAccount).reduce((s, c) => s + c.Ultimo_Valor, 0);

  const cuentasDisponible = cuentas
    .filter(isSourceAccount)
    .map((c) => ({ nombre: c.Nombre_Cuenta, valor: c.Ultimo_Valor }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const tarjetas = tarjetasConfig.tarjetas.map((t) => ({
    ...t,
    saldo: cuentas.find((c) => c.Nombre_Cuenta === t.cuenta_ref)?.Ultimo_Valor ?? 0,
  }));

  return (
    <FlujoMensualClient
      tarjetas={tarjetas}
      disponible={disponible}
      cuentasDisponible={cuentasDisponible}
    />
  );
}
