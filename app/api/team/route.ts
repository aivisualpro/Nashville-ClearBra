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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 }
      );
    }

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not connected" },
        { status: 500 }
      );
    }

    const collection = db.collection("Nashville_Users");

    const doc = {
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      roles: body.roles || "",
      status: body.status || "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...doc },
    });
  } catch (error: unknown) {
    console.error("[POST /api/team] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
