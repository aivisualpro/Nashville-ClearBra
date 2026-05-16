import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const updateMaterialSchema = z.object({
  materialName: z.string().min(1).max(200).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  unit: z.string().max(50).optional(),
  unitCost: z.coerce.number().nonnegative().nullable().optional(),
  unitPrice: z.coerce.number().nonnegative().nullable().optional(),
  supplier: z.string().max(200).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
}).passthrough();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const doc = await db.collection("Nashville_Materials").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ success: false, message: "Material not found" }, { status: 404 });
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

    const parsed = updateMaterialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const numericFields = ["unitCost", "unitPrice"];
    const data = { ...parsed.data };
    for (const f of numericFields) {
      if (data[f] != null && data[f] !== "") data[f] = Number(data[f]);
      else if (data[f] === "") data[f] = null;
    }

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const result = await db.collection("Nashville_Materials").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Material not found" }, { status: 404 });
    }
    revalidateTag("materials", "default");
    return NextResponse.json({ success: true, message: "Material updated successfully" });
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
    const result = await db.collection("Nashville_Materials").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Material not found" }, { status: 404 });
    }
    revalidateTag("materials", "default");
    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
