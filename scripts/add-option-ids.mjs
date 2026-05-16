/**
 * Add ObjectId (_id) to every option item in Nashville_Options.options[].
 * 
 * Usage: node scripts/add-option-ids.mjs
 */
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://admin_db_user:nuKlqZBN5GBvGcY6@cluster0.ybdeuck.mongodb.net/Nashville";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db("Nashville");
    const col = db.collection("Nashville_Options");
    const docs = await col.find({}).toArray();

    for (const doc of docs) {
      if (!doc.options || !Array.isArray(doc.options)) continue;

      let changed = false;
      const updatedOptions = doc.options.map((opt) => {
        if (!opt._id) {
          changed = true;
          return { _id: new ObjectId(), ...opt };
        }
        return opt;
      });

      if (changed) {
        await col.updateOne(
          { _id: doc._id },
          { $set: { options: updatedOptions, updatedAt: new Date() } }
        );
        console.log(`  ✅ "${doc.name}" → added _id to ${updatedOptions.length} options`);
      } else {
        console.log(`  ⏭  "${doc.name}" → already has _id on all options`);
      }
    }

    console.log("\n🎉 Done! All options now have ObjectId.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
