import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// GET /api/settings — fetch all settings
export async function GET() {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const docs = await db
      .collection("Nashville_Settings")
      .find({})
      .sort({ order: 1 })
      .toArray();

    const data = docs.map((d) => ({
      _id: d._id.toString(),
      key: d.key,
      label: d.label,
      dataType: d.dataType,
      value: d.value,
      order: d.order,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PUT /api/settings — upsert all settings in batch
// Body: { settings: Array<{ key, label, dataType, value, order }> }
export async function PUT(req: NextRequest) {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const body = await req.json();
    const { settings } = body as {
      settings: Array<{ key: string; label: string; dataType: string; value: string; order: number }>;
    };

    if (!Array.isArray(settings)) {
      return NextResponse.json({ success: false, message: "settings must be an array" }, { status: 400 });
    }

    // Upsert each setting by key
    const ops = settings.map((s) => ({
      updateOne: {
        filter: { key: s.key },
        update: { $set: { key: s.key, label: s.label, dataType: s.dataType, value: s.value, order: s.order, updatedAt: new Date() } },
        upsert: true,
      },
    }));

    await db.collection("Nashville_Settings").bulkWrite(ops);

    revalidateTag("settings", "default");
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PATCH /api/settings/:key — update a single setting value
// Body: { key, value }
export async function PATCH(req: NextRequest) {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const body = await req.json();
    const { key, value } = body as { key: string; value: string };

    if (!key) return NextResponse.json({ success: false, message: "key is required" }, { status: 400 });

    await db.collection("Nashville_Settings").updateOne(
      { key },
      { $set: { value, updatedAt: new Date() } },
      { upsert: true }
    );

    revalidateTag("settings", "default");
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST /api/settings/seed — seed default settings if collection is empty
export async function POST() {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const count = await db.collection("Nashville_Settings").countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: true, message: "Already seeded", seeded: 0 });
    }

    const defaults = [
      { key: "salesmanCommissionRate",    label: "Salesman Commission Rate",    dataType: "percentageValues", value: "8.50",  order: 1 },
      { key: "techEmployerTaxRate",       label: "Tech Employer Tax Rate",       dataType: "percentageValues", value: "10.00", order: 2 },
      { key: "salesmanEmployerTaxRate",   label: "SalesMan Employer Tax Rate",   dataType: "percentageValues", value: "10.00", order: 3 },
      { key: "upsellCommissionRate",      label: "Upsell Commission Rate",       dataType: "percentageValues", value: "2.50",  order: 4 },
      { key: "salesmanUpsellBonusRate",   label: "Salesman Upsell Bonus Rate",   dataType: "percentageValues", value: "2.00",  order: 5 },
      { key: "techHoursPerYear",          label: "Tech Hours Per Year",          dataType: "Number",           value: "1944",  order: 6 },
      { key: "ohcHrQ1",                   label: "OHC HR Q1",                    dataType: "dollarValues",     value: "125.00",order: 7 },
      { key: "ohcHrQ2",                   label: "OHC HR Q2",                    dataType: "dollarValues",     value: "125.00",order: 8 },
      { key: "ohcHrQ3",                   label: "OHC HR Q3",                    dataType: "dollarValues",     value: "125.00",order: 9 },
      { key: "ohcHrQ4",                   label: "OHC HR Q4",                    dataType: "dollarValues",     value: "125.00",order: 10 },
      { key: "retPpfLaborCostHr",         label: "RET PPF LABOR COST HR",        dataType: "dollarValues",     value: "45.00", order: 11 },
      { key: "retTintLaborCostHr",        label: "RET TINT LABOR COST HR",       dataType: "dollarValues",     value: "45.00", order: 12 },
      { key: "retStraightLaborCostHr",    label: "RET_STRAIGHT_LABOR_COST_HR",   dataType: "dollarValues",     value: "45.00", order: 13 },
      { key: "retCeramicLaborCostHr",     label: "RET_CERAMIC_LABOR_COST_HR",    dataType: "dollarValues",     value: "45.00", order: 14 },
      { key: "whoPpfLaborCostHr",         label: "WHO_PPF_LABOR_COST_HR",        dataType: "dollarValues",     value: "45.00", order: 15 },
      { key: "whoTintLaborCostHr",        label: "WHO_TINT_LABOR_COST_HR",       dataType: "dollarValues",     value: "45.00", order: 16 },
      { key: "whoStraightLaborCostHr",    label: "WHO_STRAIGHT_LABOR_COST_HR",   dataType: "dollarValues",     value: "45.00", order: 17 },
      { key: "whoCeramicLaborCostHr",     label: "WHO_CERAMIC_LABOR_COST_HR",    dataType: "dollarValues",     value: "45.00", order: 18 },
    ].map((s) => ({ ...s, createdAt: new Date(), updatedAt: new Date() }));

    await db.collection("Nashville_Settings").insertMany(defaults);
    revalidateTag("settings", "default");
    return NextResponse.json({ success: true, seeded: defaults.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
