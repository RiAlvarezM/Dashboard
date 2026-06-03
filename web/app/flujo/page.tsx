import { getFlows } from "@/lib/data";
import { FlujoClient } from "./flujo-client";

export default async function FlujoPage() {
  const flows = await getFlows();
  return <FlujoClient initialFlows={flows} year={2026} />;
}
