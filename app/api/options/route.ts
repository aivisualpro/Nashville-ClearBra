import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const optionItemSchema = z.object({
  value: z.string().min(1, "Value is required").max(200),
  color: z.string().max(20).optional().default(""),
  icon: z.string().max(100).optional().default(""),
});

const createOptionsSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  options: z.array(optionItemSchema).default([]),
});

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: "Database not connected" }, { status: 500 });
    }
    const docs = await db.collection("Nashville_Options").find({}).sort({ _id: -1 }).toArray();
    const serialized = docs.map((d) => ({ ...d, _id: d._id.toString() }));
    return NextResponse.json({ success: true, data: serialized, count: serialized.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = createOptionsSchema.safeParse(body);
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

    const doc = { ...parsed.data, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("Nashville_Options").insertOne(doc);
    revalidateTag("options", "default");
    return NextResponse.json({ success: true, data: { _id: result.insertedId.toString(), ...doc } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
