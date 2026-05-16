import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const optionItemSchema = z.object({
  value: z.string().min(1).max(200),
  color: z.string().max(20).optional().default(""),
  icon: z.string().max(100).optional().default(""),
});

const updateOptionsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  options: z.array(optionItemSchema).optional(),
}).passthrough();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const doc = await db.collection("Nashville_Options").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ success: false, message: "Option not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { ...doc, _id: doc._id.toString() } });
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

    const parsed = updateOptionsSchema.safeParse(body);
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
    const result = await db.collection("Nashville_Options").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Option not found" }, { status: 404 });
    }
    revalidateTag("options", "default");
    return NextResponse.json({ success: true, message: "Option updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const result = await db.collection("Nashville_Options").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Option not found" }, { status: 404 });
    }
    revalidateTag("options", "default");
    return NextResponse.json({ success: true, message: "Option deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
