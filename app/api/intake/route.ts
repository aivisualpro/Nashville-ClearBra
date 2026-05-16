import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { processTemplate } from "@/lib/google-docs";
import { uploadPdfToCloudinary } from "@/lib/cloudinary-pdf";
import { buildReplacements } from "@/lib/pdf-replacements";

const TEMPLATE_ID = "18YVyatLxFeQf_moBqdTJx4jly9nvYrJFXi2vHG9uR7Q";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const collection = db.collection("Nashville_Jobs");

    // Add metadata
    const record = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "New",
      source: "Intake Form",
    };

    const result = await collection.insertOne(record);
    const jobId = result.insertedId.toString();

    // Generate PDF in background (don't block the response)
    generateAndStorePdf(body, jobId, collection).catch((err) =>
      console.error("[PDF Background] Failed:", err.message)
    );

    return NextResponse.json({
      success: true,
      id: jobId,
      message: "Work order submitted successfully",
    });
  } catch (error) {
    console.error("Error saving intake form:", error);
    return NextResponse.json(
      { error: "Failed to save work order" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateAndStorePdf(data: Record<string, any>, jobId: string, collection: any) {
  const replacements = buildReplacements(data);
  const ro = data.ro || "WO";

  const pdfBuffer = await processTemplate(
    TEMPLATE_ID,
    `T_${Date.now()}`,
    replacements
  );

  const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, `NCB-${ro}-${jobId}`);

  // Store the PDF URL on the job document
  await collection.updateOne(
    { _id: new mongoose.Types.ObjectId(jobId) },
    { $set: { jobOrderPdf: pdfUrl } }
  );

  console.log(`[PDF] Generated & stored for job ${jobId}: ${pdfUrl}`);
}
