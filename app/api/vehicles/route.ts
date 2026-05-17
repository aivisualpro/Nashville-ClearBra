import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

/**
 * GET /api/vehicles?type=makes
 * GET /api/vehicles?type=models&makeId=<Nashville_Make _id>
 * GET /api/vehicles?type=submodels&modelId=<Nashville_Model _id>
 */
export async function GET(req: NextRequest) {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const type    = searchParams.get("type")    || "makes";
    const makeId  = searchParams.get("makeId");
    const modelId = searchParams.get("modelId");

    // ── Makes ─────────────────────────────────────────────────────────────────
    if (type === "makes") {
      const docs = await db
        .collection("Nashville_Make")
        .find({})
        .sort({ vehicleMake: 1 })
        .toArray();
      return NextResponse.json({
        success: true,
        data: docs
          .map((d) => ({ _id: d._id.toString(), name: d.vehicleMake || "", logo: d.logo || "" }))
          .filter((d) => d.name),
      });
    }

    // ── Models for a make (vehicleMake is an ObjectId ref) ────────────────────
    if (type === "models" && makeId) {
      let oid: mongoose.Types.ObjectId;
      try { oid = new mongoose.Types.ObjectId(makeId); } catch {
        return NextResponse.json({ success: true, data: [] });
      }
      const docs = await db
        .collection("Nashville_Model")
        .find({ vehicleMake: oid })
        .sort({ vehicleModel: 1 })
        .toArray();
      return NextResponse.json({
        success: true,
        data: docs
          .map((d) => ({ _id: d._id.toString(), name: d.vehicleModel || "" }))
          .filter((d) => d.name),
      });
    }

    // ── Submodels for a model (vehicleModel is an ObjectId ref) ───────────────
    if (type === "submodels" && modelId) {
      let oid: mongoose.Types.ObjectId;
      try { oid = new mongoose.Types.ObjectId(modelId); } catch {
        return NextResponse.json({ success: true, data: [] });
      }
      const docs = await db
        .collection("Nashville_SubModel")
        .find({ vehicleModel: oid })
        .sort({ vehicleSubmodel: 1 })
        .toArray();
      return NextResponse.json({
        success: true,
        data: docs
          .map((d) => ({ _id: d._id.toString(), name: d.vehicleSubmodel || "" }))
          .filter((d) => d.name),
      });
    }

    return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
