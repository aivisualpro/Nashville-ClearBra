import { getTeamMember } from "@/lib/data";
import { TeamProfileClient } from "@/components/team-profile-client";
import { notFound } from "next/navigation";

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getTeamMember(id);

  if (!user) {
    notFound();
  }

  return <TeamProfileClient initialData={user} userId={id} />;
}
