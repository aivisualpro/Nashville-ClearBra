import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginLanding } from "@/components/login-landing";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params?.error;

  return <LoginLanding error={error} />;
}
