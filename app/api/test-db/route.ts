import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await dbConnect();
    const dbName = mongoose.connection.db?.databaseName;

    return NextResponse.json({
      success: true,
      message: "Connected to Nashville MongoDB successfully!",
      database: dbName,
      readyState: mongoose.connection.readyState,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to database",
        error: message,
      },
      { status: 500 }
    );
  }
}
