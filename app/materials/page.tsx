import { getMaterials } from "@/lib/data";
import { MaterialsClient } from "@/components/materials-client";

export default async function MaterialsPage() {
  const data = await getMaterials();
  return <MaterialsClient initialData={data} />;
}
