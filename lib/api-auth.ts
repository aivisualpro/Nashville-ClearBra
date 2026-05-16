/**
 * Server-side API auth guard.
 * Use this in Route Handlers to protect mutations.
 */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { authorized: true as const, session };
}
