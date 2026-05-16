/**
 * Server-side data fetching functions with caching.
 * Uses unstable_cache to avoid hitting MongoDB on every navigation.
 * Data is revalidated every 30s (stale-while-revalidate pattern).
 */
import dbConnect from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

/** Serialize a MongoDB document (convert _id to string, dates to ISO) */
function serialize(doc: Doc): Doc {
  const { _id, ...rest } = doc;
  const serialized: Doc = { _id: _id.toString() };
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (value && typeof value === "object" && value._bsontype === "ObjectId") {
      serialized[key] = value.toString();
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

// ─── Raw fetchers (not cached — used by cache wrappers) ─────────────────────

async function _fetchServices(): Promise<Doc[]> {
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

async function _fetchMaterials(): Promise<Doc[]> {
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

async function _fetchTeamMembers(): Promise<Doc[]> {
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

async function _fetchTeamMember(id: string): Promise<Doc | null> {
  const { ObjectId } = await import("mongodb");
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return null;
  const doc = await db
    .collection("Nashville_Users")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

async function _fetchJobs(): Promise<Doc[]> {
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

// ─── Cached exports ─────────────────────────────────────────────────────────
// revalidate: 30 = serve stale data instantly, re-fetch in background every 30s

export const getServices = unstable_cache(
  _fetchServices,
  ["services"],
  { revalidate: 30, tags: ["services"] }
);

export const getMaterials = unstable_cache(
  _fetchMaterials,
  ["materials"],
  { revalidate: 30, tags: ["materials"] }
);

export const getTeamMembers = unstable_cache(
  _fetchTeamMembers,
  ["team"],
  { revalidate: 30, tags: ["team"] }
);

export const getTeamMember = unstable_cache(
  _fetchTeamMember,
  ["team-member"],
  { revalidate: 30, tags: ["team"] }
);

export const getJobs = unstable_cache(
  _fetchJobs,
  ["jobs"],
  { revalidate: 30, tags: ["jobs"] }
);

// ─── Options ────────────────────────────────────────────────────────────────

async function _fetchOptions(): Promise<Doc[]> {
  const mongoose = await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];
  const docs = await db
    .collection("Nashville_Options")
    .find({})
    .sort({ _id: -1 })
    .toArray();
  return docs.map(serialize);
}

export const getOptions = unstable_cache(
  _fetchOptions,
  ["options"],
  { revalidate: 30, tags: ["options"] }
);
