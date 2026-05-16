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

    const collection = db.collection("Nashville_Users");
    const users = await collection.find({}).sort({ _id: -1 }).toArray();

    const serializedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedUsers,
      count: serializedUsers.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch team members",
        error: message,
      },
      { status: 500 }
    );
  }
}
