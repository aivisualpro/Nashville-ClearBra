import { getJobs } from "@/lib/data";
import { JobsClient } from "@/components/jobs-client";

export default async function JobsPage() {
  const data = await getJobs();
  return <JobsClient initialData={data} />;
}
