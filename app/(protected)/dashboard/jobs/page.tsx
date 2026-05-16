import { getJobs } from "@/lib/data";
import { JobsClient } from "@/components/jobs-client";

export default async function DashboardJobsPage() {
  const data = await getJobs();
  return <JobsClient initialData={data} />;
}
