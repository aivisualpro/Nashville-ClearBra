import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const createTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required").max(200),
  phone: z.string().max(50).optional().default(""),
  roles: z.string().max(200).optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not connected" },
        { status: 500 }
      );
    }

    const collection = db.collection("Nashville_Users");
    const users = await collection.find({}).sort({ _id: -1 }).toArray();

    const serializedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedUsers,
      count: serializedUsers.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch team members",
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();

    const parsed = createTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not connected" },
        { status: 500 }
      );
    }

    const collection = db.collection("Nashville_Users");

    const doc = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    revalidateTag("team", "default");

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...doc },
    });
  } catch (error: unknown) {
    console.error("[POST /api/team] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
