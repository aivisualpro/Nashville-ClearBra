import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processTemplate } from "@/lib/google-docs";
import { uploadPdfToCloudinary } from "@/lib/cloudinary-pdf";
import { buildReplacements } from "@/lib/pdf-replacements";

const TEMPLATE_ID = "18YVyatLxFeQf_moBqdTJx4jly9nvYrJFXi2vHG9uR7Q";

export const dynamic = "force-dynamic";

// GET /api/jobs/[id] — fetch a single job
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const doc = await db.collection("Nashville_Jobs").findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!doc) return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: { ...doc, _id: doc._id.toString() },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PUT /api/jobs/[id] — update job + generate changeLogs
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const body = await req.json();
    const { _id, changeLogs: _cl, createdAt: _ca, ...updateData } = body;

    // Get current doc to diff
    const collection = db.collection("Nashville_Jobs");
    const currentDoc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!currentDoc) return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });

    // Get logged-in user
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId || null;

    // Generate change logs by comparing old vs new
    const newLogs: Array<{
      userId: mongoose.Types.ObjectId | null;
      timestamp: Date;
      field: string;
      from: unknown;
      to: unknown;
    }> = [];

    const SKIP_FIELDS = ["updatedAt", "_id", "changeLogs", "createdAt", "jobOrderPdf"];

    for (const key of Object.keys(updateData)) {
      if (SKIP_FIELDS.includes(key)) continue;
      const oldVal = currentDoc[key];
      const newVal = updateData[key];
      const oldStr = JSON.stringify(oldVal ?? "");
      const newStr = JSON.stringify(newVal ?? "");
      if (oldStr !== newStr) {
        newLogs.push({
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
          timestamp: new Date(),
          field: key,
          from: oldVal ?? null,
          to: newVal ?? null,
        });
      }
    }

    // Update the document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOp: any = {
      $set: { ...updateData, updatedAt: new Date() },
    };
    if (newLogs.length > 0) {
      updateOp.$push = { changeLogs: { $each: newLogs } };
    }
    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      updateOp
    );

    // Regenerate PDF in background (don't block the response)
    const fullData = { ...currentDoc, ...updateData };
    regeneratePdf(fullData, id, collection).catch((err) =>
      console.error("[PDF Background] Failed:", err.message)
    );

    return NextResponse.json({ success: true, changes: newLogs.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function regeneratePdf(data: Record<string, any>, jobId: string, collection: any) {
  const replacements = buildReplacements(data);
  const ro = data.ro || "WO";

  const pdfBuffer = await processTemplate(
    TEMPLATE_ID,
    `T_${Date.now()}`,
    replacements
  );

  const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, `NCB-${ro}-${jobId}`);

  await collection.updateOne(
    { _id: new mongoose.Types.ObjectId(jobId) },
    { $set: { jobOrderPdf: pdfUrl } }
  );

  console.log(`[PDF] Regenerated for job ${jobId}: ${pdfUrl}`);
}

