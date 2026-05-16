import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const updateServiceSchema = z.object({
  sku: z.string().max(100).optional(),
  serviceName: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  billedHours: z.coerce.number().nonnegative().nullable().optional(),
  breakEvenPrice: z.coerce.number().nonnegative().nullable().optional(),
  retailPriceTarget: z.coerce.number().nonnegative().nullable().optional(),
  retailPriceMin: z.coerce.number().nonnegative().nullable().optional(),
  overheadOutrunPrice: z.coerce.number().nonnegative().nullable().optional(),
  wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  fileSeries: z.string().max(100).optional(),
  masterGroup: z.string().max(100).optional(),
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
    const collection = db.collection("Nashville_Services");
    const service = await collection.findOne({ _id: new ObjectId(id) });
    if (!service) {
      return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { ...service, _id: service._id.toString() } });
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

    // Validate with Zod
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Convert numeric fields
    const numericFields = ["billedHours", "breakEvenPrice", "retailPriceTarget", "retailPriceMin", "overheadOutrunPrice", "wholesalePrice"];
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
    const collection = db.collection("Nashville_Services");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Service updated successfully" });
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
    const collection = db.collection("Nashville_Services");
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
