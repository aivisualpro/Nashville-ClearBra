/**
 * Server-side data fetching functions.
 * These run ONLY on the server (in Server Components / Route Handlers).
 * Data is fetched at render time so the UI never shows a loading spinner.
 */
import dbConnect from "@/lib/mongodb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

/** Serialize a MongoDB document (convert _id to string, etc.) */
function serialize(doc: Doc): Doc {
  const { _id, ...rest } = doc;
  return { _id: _id.toString(), ...rest };
}

// ─── Services ───────────────────────────────────────────────────────────────

export async function getServices(): Promise<Doc[]> {
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];
  const docs = await db
    .collection("Nashville_Services")
    .find({})
    .sort({ _id: -1 })
    .toArray();
  return docs.map(serialize);
}

// ─── Materials ──────────────────────────────────────────────────────────────

export async function getMaterials(): Promise<Doc[]> {
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];
  const docs = await db
    .collection("Nashville_Materials")
    .find({})
    .sort({ _id: -1 })
    .toArray();
  return docs.map(serialize);
}

// ─── Team ───────────────────────────────────────────────────────────────────

export async function getTeamMembers(): Promise<Doc[]> {
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];
  const docs = await db
    .collection("Nashville_Users")
    .find({})
    .sort({ _id: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getTeamMember(id: string): Promise<Doc | null> {
  const { ObjectId } = await import("mongodb");
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return null;
  const doc = await db
    .collection("Nashville_Users")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function getJobs(): Promise<Doc[]> {
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];
  const docs = await db
    .collection("Nashville_Jobs")
    .find({})
    .sort({ _id: -1 })
    .toArray();
  return docs.map(serialize);
}
