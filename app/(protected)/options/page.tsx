import { getOptions } from "@/lib/data";
import { OptionsClient } from "@/components/options-client";

export default async function OptionsPage() {
  const data = await getOptions();
  return <OptionsClient initialData={data} />;
}
