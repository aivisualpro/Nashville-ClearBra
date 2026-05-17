import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

/**
 * Nashville_Make     → { _id, vehicleMake: "Toyota" }                         ← vehicleMake is the name string
 * Nashville_Model    → { _id, vehicleMake: ObjectId(makeId), vehicleModel: "Camry" } ← ObjectId ref
 * Nashville_SubModel → { _id, vehicleMake: ObjectId, vehicleModel: ObjectId, vehicleSubmodel: "SE" } ← both ObjectId refs
 */

export async function GET(req: NextRequest) {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const type     = searchParams.get("type");
    const makeId   = searchParams.get("makeId");   // _id of Nashville_Make doc
    const modelId  = searchParams.get("modelId");  // _id of Nashville_Model doc

    // ── Debug ────────────────────────────────────────────────────────────────
    if (type === "debug") {
      const makes  = await db.collection("Nashville_Make").find({}).limit(5).toArray();
      const models = await db.collection("Nashville_Model").find({}).limit(5).toArray();
      const subs   = await db.collection("Nashville_SubModel").find({}).limit(5).toArray();
      return NextResponse.json({
        makeCount: await db.collection("Nashville_Make").countDocuments(),
        makes:  makes.map((d)  => ({ ...d, _id: d._id.toString() })),
        models: models.map((d) => ({ ...d, _id: d._id.toString() })),
        subs:   subs.map((d)   => ({ ...d, _id: d._id.toString() })),
      });
    }

    // ── Models — vehicleMake is an ObjectId ref to Nashville_Make._id ──────────
    if (type === "models" && makeId) {
      let makeOid;
      try { makeOid = new mongoose.Types.ObjectId(makeId); } catch {
        return NextResponse.json({ success: true, data: [] });
      }

      const docs = await db
        .collection("Nashville_Model")
        .find({ vehicleMake: makeOid })
        .sort({ vehicleModel: 1 })
        .toArray();

      return NextResponse.json({
        success: true,
        data: docs
          .map((d) => ({ _id: d._id.toString(), name: d.vehicleModel || d.name || d.value || "" }))
          .filter((d) => d.name),
      });
    }

    // ── Submodels — vehicleMake & vehicleModel are both ObjectId refs ─────────
    if (type === "submodels" && makeId && modelId) {
      let makeOid, modelOid;
      try { makeOid  = new mongoose.Types.ObjectId(makeId);  } catch { return NextResponse.json({ success: true, data: [] }); }
      try { modelOid = new mongoose.Types.ObjectId(modelId); } catch { return NextResponse.json({ success: true, data: [] }); }

      const docs = await db
        .collection("Nashville_SubModel")
        .find({ vehicleMake: makeOid, vehicleModel: modelOid })
        .sort({ vehicleSubmodel: 1 })
        .toArray();

      return NextResponse.json({
        success: true,
        data: docs
          .map((d) => ({ _id: d._id.toString(), name: d.vehicleSubmodel || d.name || d.value || "" }))
          .filter((d) => d.name),
      });
    }

    // ── Makes (default) ───────────────────────────────────────────────────────
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

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/**
 * POST /api/vehicle — create a new make, model, or submodel
 */
export async function POST(req: NextRequest) {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const body = await req.json();
    const { type, name, makeId, modelId } = body as {
      type: string; name: string; makeId?: string; modelId?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    // Helper: resolve name strings for parent references
    async function getMakeName(id: string): Promise<string | null> {
      try {
        const doc = await db!.collection("Nashville_Make").findOne(
          { _id: new mongoose.Types.ObjectId(id) }
        );
        return doc?.vehicleMake ?? null;
      } catch { return null; }
    }
    async function getModelName(id: string): Promise<string | null> {
      try {
        const doc = await db!.collection("Nashville_Model").findOne(
          { _id: new mongoose.Types.ObjectId(id) }
        );
        return doc?.vehicleModel ?? null;
      } catch { return null; }
    }

    if (type === "make") {
      const result = await db.collection("Nashville_Make").insertOne({
        vehicleMake: name.trim(), createdAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        data: { _id: result.insertedId.toString(), name: name.trim() },
      });
    }

    if (type === "model" && makeId) {
      const mName = await getMakeName(makeId);
      if (!mName) return NextResponse.json({ success: false, message: "Make not found" }, { status: 400 });

      const result = await db.collection("Nashville_Model").insertOne({
        vehicleMake: mName, vehicleModel: name.trim(), createdAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        data: { _id: result.insertedId.toString(), name: name.trim() },
      });
    }

    if (type === "submodel" && makeId && modelId) {
      const mName  = await getMakeName(makeId);
      const mdName = await getModelName(modelId);
      if (!mName || !mdName) return NextResponse.json({ success: false, message: "Make or Model not found" }, { status: 400 });

      const result = await db.collection("Nashville_SubModel").insertOne({
        vehicleMake: mName, vehicleModel: mdName, vehicleSubmodel: name.trim(), createdAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        data: { _id: result.insertedId.toString(), name: name.trim() },
      });
    }

    return NextResponse.json({ success: false, message: "Invalid type or missing parent IDs" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
