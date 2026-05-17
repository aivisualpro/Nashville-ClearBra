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

    const raw: Record<string, any> = { ...doc, _id: doc._id.toString() };
    // Stringify ObjectId reference fields for the client
    if (raw.vMakeId) raw.vMakeId = raw.vMakeId.toString();
    if (raw.vModelId) raw.vModelId = raw.vModelId.toString();
    if (raw.vSubmodelId) raw.vSubmodelId = raw.vSubmodelId.toString();
    return NextResponse.json({ success: true, data: raw });
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

    // Convert vehicle reference fields to ObjectId
    if (updateData.vMakeId && typeof updateData.vMakeId === "string" && updateData.vMakeId.length === 24) {
      updateData.vMakeId = new mongoose.Types.ObjectId(updateData.vMakeId);
    }
    if (updateData.vModelId && typeof updateData.vModelId === "string" && updateData.vModelId.length === 24) {
      updateData.vModelId = new mongoose.Types.ObjectId(updateData.vModelId);
    }
    if (updateData.vSubmodelId && typeof updateData.vSubmodelId === "string" && updateData.vSubmodelId.length === 24) {
      updateData.vSubmodelId = new mongoose.Types.ObjectId(updateData.vSubmodelId);
    }

    // Update the document — mark PDF as regenerating
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOp: any = {
      $set: { ...updateData, updatedAt: new Date(), jobOrderPdf: "generating" },
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
    regeneratePdf(fullData, id, collection).catch(async (err) => {
      console.error("[PDF Background] Failed:", err.message);
      // Reset so spinner doesn't spin forever
      try {
        await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: { jobOrderPdf: "" } }
        );
      } catch { /* ignore */ }
    });

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
    replacements,
    data.damageDiagramUrl
      ? { damage_diagram: String(data.damageDiagramUrl) }
      : undefined
  );

  const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, `NCB-${ro}-${jobId}`);

  await collection.updateOne(
    { _id: new mongoose.Types.ObjectId(jobId) },
    { $set: { jobOrderPdf: pdfUrl } }
  );

  console.log(`[PDF] Regenerated for job ${jobId}: ${pdfUrl}`);
}

