import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createServiceSchema = z.object({
  sku: z.string().max(100).optional().default(""),
  serviceName: z.string().min(1, "Service name is required").max(200),
  category: z.string().max(100).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  billedHours: z.coerce.number().nonnegative().nullable().optional(),
  breakEvenPrice: z.coerce.number().nonnegative().nullable().optional(),
  retailPriceTarget: z.coerce.number().nonnegative().nullable().optional(),
  retailPriceMin: z.coerce.number().nonnegative().nullable().optional(),
  overheadOutrunPrice: z.coerce.number().nonnegative().nullable().optional(),
  wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  fileSeries: z.string().max(100).optional().default(""),
  masterGroup: z.string().max(100).optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const collection = db.collection("Nashville_Services");
    const services = await collection.find({}).sort({ _id: -1 }).toArray();
    const serialized = services.map((s) => ({ ...s, _id: s._id.toString() }));
    return NextResponse.json({ success: true, data: serialized, count: serialized.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, message: "Failed to fetch services", error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Auth check
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();

    // Validate with Zod
    const parsed = createServiceSchema.safeParse(body);
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
    const collection = db.collection("Nashville_Services");
    const doc = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ success: true, data: { _id: result.insertedId.toString(), ...doc } });
  } catch (error: unknown) {
    console.error("[POST /api/services] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
