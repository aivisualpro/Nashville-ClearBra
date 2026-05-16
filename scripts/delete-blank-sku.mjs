// Delete all records from Nashville_Services where sku is blank/null/empty
// Usage: node scripts/delete-blank-sku.mjs

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read .env.local manually (no dotenv needed)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const match = envContent.match(/^MONGODB_URI=(.+)$/m);
const uri = match?.[1]?.trim();

if (!uri) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("Nashville");
    const col = db.collection("Nashville_Services");

    const matches = await col.countDocuments({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: "" },
      ],
    });

    console.log(`Found ${matches} record(s) with blank/missing SKU.`);

    if (matches === 0) {
      console.log("Nothing to delete.");
      return;
    }

    const result = await col.deleteMany({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: "" },
      ],
    });

    console.log(`✅ Deleted ${result.deletedCount} record(s).`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

run();
