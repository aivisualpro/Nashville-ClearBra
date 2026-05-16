import { getTeamMembers } from "@/lib/data";
import { TeamClient } from "@/components/team-client";

export default async function TeamPage() {
  const data = await getTeamMembers();
  return <TeamClient initialData={data} />;
}
