import { NextRequest, NextResponse } from "next/server";
import { processTemplate } from "@/lib/google-docs";
import { buildReplacements } from "@/lib/pdf-replacements";
import { uploadPdfToCloudinary } from "@/lib/cloudinary-pdf";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEMPLATE_ID = "18YVyatLxFeQf_moBqdTJx4jly9nvYrJFXi2vHG9uR7Q";

/**
 * POST /api/intake/pdf — Manual PDF regeneration.
 * Generates, uploads to Cloudinary, updates the DB record, and returns the URL.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const ro = data.ro || "WO";
    const jobId = data._id;

    const replacements = buildReplacements(data);

    const pdfBuffer = await processTemplate(
      TEMPLATE_ID,
      `T_${Date.now()}`,
      replacements,
      data.damageDiagramUrl
        ? { damage_diagram: String(data.damageDiagramUrl) }
        : undefined
    );

    const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, `NCB-${ro}-${jobId || Date.now()}`);

    // Update the DB record if we have a job ID
    if (jobId) {
      const conn = await dbConnect();
      const db = conn.connection.db;
      if (db) {
        await db.collection("Nashville_Jobs").updateOne(
          { _id: new mongoose.Types.ObjectId(jobId) },
          { $set: { jobOrderPdf: pdfUrl } }
        );
      }
    }

    return NextResponse.json({ success: true, url: pdfUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[PDF Generation Error]", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
