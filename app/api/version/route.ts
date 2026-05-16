import { NextResponse } from "next/server";
import { APP_VERSION, BUILD_HASH } from "@/lib/version";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ version: APP_VERSION, hash: BUILD_HASH });
}
