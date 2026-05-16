/**
 * Seed script: Add Vehicle Make options to Nashville_Options collection.
 * 
 * Usage: node scripts/seed-vehicle-makes.mjs
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://admin_db_user:nuKlqZBN5GBvGcY6@cluster0.ybdeuck.mongodb.net/Nashville";

const makes = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac",
  "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC",
  "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Lotus", "Lucid", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Polestar", "Pontiac", "Porsche", "Ram", "Rivian",
  "Rolls-Royce", "Saab", "Saturn", "Scion", "Subaru", "Suzuki", "Tesla", "Toyota",
  "Volkswagen", "Volvo", "Harley-Davidson", "Ducati", "Yamaha", "Kawasaki",
];

const options = makes.map((m) => ({ value: m, color: "", icon: "" }));

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Nashville");
    const col = db.collection("Nashville_Options");

    const result = await col.updateOne(
      { name: "Vehicle Make" },
      {
        $set: { options, updatedAt: new Date() },
        $setOnInsert: { name: "Vehicle Make", createdAt: new Date() },
      },
      { upsert: true }
    );

    if (result.upsertedCount) {
      console.log(`✅ Created "Vehicle Make" with ${makes.length} options`);
    } else {
      console.log(`✅ Updated "Vehicle Make" with ${makes.length} options`);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
