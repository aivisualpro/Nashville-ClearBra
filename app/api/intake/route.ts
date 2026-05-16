import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

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

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
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
