import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not connected" },
        { status: 500 }
      );
    }

    const collection = db.collection("Nashville_Jobs");
    const jobs = await collection.find({}).sort({ _id: -1 }).toArray();

    // Convert _id to string for JSON serialization
    const serializedJobs = jobs.map((job) => ({
      ...job,
      _id: job._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedJobs,
      count: serializedJobs.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch jobs",
        error: message,
      },
      { status: 500 }
    );
  }
}
