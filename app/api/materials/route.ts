import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const createMaterialSchema = z.object({
  materialName: z.string().min(1, "Material name is required").max(200),
  sku: z.string().max(100).optional().default(""),
  category: z.string().max(100).optional().default(""),
  brand: z.string().max(100).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  unit: z.string().max(50).optional().default(""),
  unitCost: z.coerce.number().nonnegative().nullable().optional(),
  unitPrice: z.coerce.number().nonnegative().nullable().optional(),
  supplier: z.string().max(200).optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const collection = db.collection("Nashville_Materials");
    const materials = await collection.find({}).sort({ _id: -1 }).toArray();
    const serialized = materials.map((m) => ({ ...m, _id: m._id.toString() }));
    return NextResponse.json({ success: true, data: serialized, count: serialized.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, message: "Failed to fetch materials", error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();

    const parsed = createMaterialSchema.safeParse(body);
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
    const collection = db.collection("Nashville_Materials");

    const doc: Record<string, unknown> = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Convert numeric fields
    const numericFields = ["unitCost", "unitPrice"];
    for (const f of numericFields) {
      if (doc[f] != null && doc[f] !== "") doc[f] = Number(doc[f]);
      else if (doc[f] === "") doc[f] = null;
    }

    const result = await collection.insertOne(doc);
    revalidateTag("materials", "default");
    return NextResponse.json({ success: true, data: { _id: result.insertedId.toString(), ...doc } });
  } catch (error: unknown) {
    console.error("[POST /api/materials] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
