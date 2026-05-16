import { getServices } from "@/lib/data";
import { ServicesClient } from "@/components/services-client";

export default async function ServicesPage() {
  const data = await getServices();
  return <ServicesClient initialData={data} />;
}
