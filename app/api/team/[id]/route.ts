import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(50).optional(),
  roles: z.union([z.string(), z.array(z.string())]).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  profileImage: z.string().url().nullable().optional(),
  techSalary: z.coerce.number().nonnegative().nullable().optional(),
  techHourlyRate: z.coerce.number().nonnegative().nullable().optional(),
  techBillHourlyRate: z.coerce.number().nonnegative().nullable().optional(),
  techLoadedHourlyRate: z.coerce.number().nonnegative().nullable().optional(),
  allowedServices: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const collection = db.collection("Nashville_Users");
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { ...user, _id: user._id.toString() } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    delete body._id;

    const parsed = updateTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const collection = db.collection("Nashville_Users");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
