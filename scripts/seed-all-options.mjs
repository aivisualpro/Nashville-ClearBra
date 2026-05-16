/**
 * Seed script: Assign colors & icons to ALL Nashville_Options.
 * 
 * Usage: node scripts/seed-all-options.mjs
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://admin_db_user:nuKlqZBN5GBvGcY6@cluster0.ybdeuck.mongodb.net/Nashville";

// ─── Data map: { "Option Set Name": [ { value, color, icon }, ... ] } ────

const ALL_OPTIONS = {
  "Referral Program": [
    { value: "Tesla", color: "#DC2626", icon: "Car" },
    { value: "Rivian", color: "#16A34A", icon: "Truck" },
  ],

  "Lead Source": [
    { value: "Tmc Forum", color: "#3B82F6", icon: "MessagesSquare" },
    { value: "Rivian Forums", color: "#16A34A", icon: "MessagesSquare" },
    { value: "Cybertruck Forums", color: "#6B7280", icon: "MessagesSquare" },
    { value: "FB Ads", color: "#1D4ED8", icon: "ThumbsUp" },
    { value: "IG Ads", color: "#E11D48", icon: "Camera" },
    { value: "Referral", color: "#22C55E", icon: "Users" },
    { value: "Website Direct", color: "#0EA5E9", icon: "Globe" },
    { value: "Google Not Sponsored", color: "#4338CA", icon: "Search" },
    { value: "Yahoo", color: "#7C3AED", icon: "Search" },
    { value: "Bing", color: "#0891B2", icon: "Search" },
    { value: "Duck Duck Go", color: "#F97316", icon: "Search" },
    { value: "Google Ads", color: "#16A34A", icon: "Megaphone" },
    { value: "Youtube", color: "#DC2626", icon: "Play" },
    { value: "Tik Tok", color: "#111827", icon: "Music" },
    { value: "Text Blast", color: "#059669", icon: "MessageSquare" },
    { value: "Walk-In", color: "#EA580C", icon: "Footprints" },
    { value: "Phone Inquiry", color: "#2563EB", icon: "Phone" },
    { value: "Event", color: "#7C3AED", icon: "Calendar" },
    { value: "Car Dealership", color: "#1B2A4A", icon: "Car" },
    { value: "Previous Client", color: "#14B8A6", icon: "UserCheck" },
    { value: "Grok", color: "#111827", icon: "Bot" },
    { value: "GPT", color: "#10B981", icon: "Bot" },
    { value: "Word Of Mouth", color: "#F59E0B", icon: "MessageCircle" },
    { value: "Past Client Referral", color: "#22C55E", icon: "UserPlus" },
    { value: "Direct Mail", color: "#3B82F6", icon: "Mail" },
    { value: "Linkedin Ads", color: "#0284C7", icon: "Linkedin" },
    { value: "Youtube Influencers / Sponsorships", color: "#DC2626", icon: "Video" },
    { value: "Google My Business (GMB)", color: "#4338CA", icon: "MapPin" },
    { value: "Pinterest", color: "#BE123C", icon: "Pin" },
    { value: "Snapchat", color: "#EAB308", icon: "Ghost" },
    { value: "Reddit", color: "#F97316", icon: "MessageSquare" },
  ],

  "Payment Method": [
    { value: "Credit Card", color: "#2563EB", icon: "CreditCard" },
    { value: "Debit Card", color: "#16A34A", icon: "CreditCard" },
    { value: "Cash", color: "#22C55E", icon: "Banknote" },
    { value: "Check", color: "#3B82F6", icon: "FileCheck" },
    { value: "Bank Transfer", color: "#1B2A4A", icon: "Building" },
    { value: "Paypal", color: "#0284C7", icon: "Wallet" },
    { value: "Venmo", color: "#0891B2", icon: "Smartphone" },
    { value: "Zelle", color: "#7C3AED", icon: "Send" },
    { value: "Financing", color: "#F97316", icon: "Percent" },
    { value: "Insurance", color: "#DC2626", icon: "Shield" },
    { value: "Gift Card", color: "#EC4899", icon: "Gift" },
    { value: "Mobile Payment", color: "#14B8A6", icon: "Smartphone" },
    { value: "Apple Pay", color: "#111827", icon: "Smartphone" },
    { value: "Google Pay", color: "#4338CA", icon: "Wallet" },
    { value: "Wire Transfer", color: "#374151", icon: "ArrowRightLeft" },
    { value: "Money Order", color: "#9A3412", icon: "Receipt" },
    { value: "Cryptocurrency", color: "#F59E0B", icon: "Coins" },
    { value: "Other", color: "#6B7280", icon: "CircleDot" },
  ],

  "Invoice Status": [
    { value: "Pending", color: "#F59E0B", icon: "Clock" },
    { value: "Paid", color: "#22C55E", icon: "CheckCircle" },
    { value: "Partially Paid", color: "#3B82F6", icon: "CircleDot" },
    { value: "Overdue", color: "#DC2626", icon: "AlertTriangle" },
    { value: "Awaiting Approval", color: "#F97316", icon: "Hourglass" },
    { value: "Processed", color: "#14B8A6", icon: "CircleCheck" },
    { value: "Cancelled", color: "#6B7280", icon: "XCircle" },
    { value: "Refunded", color: "#7C3AED", icon: "RotateCcw" },
    { value: "Disputed", color: "#991B1B", icon: "AlertOctagon" },
  ],

  "Invoice Paid": [
    { value: "Yes", color: "#22C55E", icon: "Check" },
    { value: "No", color: "#DC2626", icon: "X" },
    { value: "Partial Payment", color: "#3B82F6", icon: "CircleDot" },
    { value: "Payment Pending", color: "#F59E0B", icon: "Clock" },
    { value: "Payment Cleared", color: "#16A34A", icon: "CircleCheck" },
    { value: "Payment Failed", color: "#991B1B", icon: "XCircle" },
    { value: "Under Dispute", color: "#F97316", icon: "AlertTriangle" },
    { value: "Deposit", color: "#0891B2", icon: "ArrowDownCircle" },
  ],

  "Vehicle Color": [
    { value: "Green", color: "#22C55E", icon: "Paintbrush" },
    { value: "Yellow", color: "#EAB308", icon: "Paintbrush" },
    { value: "Orange", color: "#F97316", icon: "Paintbrush" },
    { value: "Red", color: "#EF4444", icon: "Paintbrush" },
    { value: "Purple", color: "#A855F7", icon: "Paintbrush" },
    { value: "Blue", color: "#3B82F6", icon: "Paintbrush" },
    { value: "White", color: "#E5E7EB", icon: "Paintbrush" },
    { value: "Black", color: "#111827", icon: "Paintbrush" },
    { value: "Grey", color: "#6B7280", icon: "Paintbrush" },
    { value: "Silver", color: "#9CA3AF", icon: "Paintbrush" },
    { value: "Tan", color: "#D2B48C", icon: "Paintbrush" },
    { value: "Gold", color: "#D97706", icon: "Paintbrush" },
    { value: "Teal", color: "#14B8A6", icon: "Paintbrush" },
    { value: "Pink", color: "#EC4899", icon: "Paintbrush" },
    { value: "Cream", color: "#FDE68A", icon: "Paintbrush" },
    { value: "Brown", color: "#9A3412", icon: "Paintbrush" },
    { value: "Burgundy", color: "#831843", icon: "Paintbrush" },
    { value: "Maroon", color: "#7F1D1D", icon: "Paintbrush" },
    { value: "Navy", color: "#1E3A8A", icon: "Paintbrush" },
    { value: "Bronze", color: "#B45309", icon: "Paintbrush" },
  ],

  "USA States": [
    { value: "Alabama", color: "#1B2A4A", icon: "MapPin" },
    { value: "Alaska", color: "#0891B2", icon: "MapPin" },
    { value: "Arizona", color: "#F97316", icon: "MapPin" },
    { value: "Arkansas", color: "#DC2626", icon: "MapPin" },
    { value: "California", color: "#EAB308", icon: "MapPin" },
    { value: "Colorado", color: "#2563EB", icon: "MapPin" },
    { value: "Connecticut", color: "#1D4ED8", icon: "MapPin" },
    { value: "Delaware", color: "#0284C7", icon: "MapPin" },
    { value: "Florida", color: "#F97316", icon: "MapPin" },
    { value: "Georgia", color: "#DC2626", icon: "MapPin" },
    { value: "Hawaii", color: "#14B8A6", icon: "MapPin" },
    { value: "Idaho", color: "#16A34A", icon: "MapPin" },
    { value: "Illinois", color: "#2563EB", icon: "MapPin" },
    { value: "Indiana", color: "#1B2A4A", icon: "MapPin" },
    { value: "Iowa", color: "#EAB308", icon: "MapPin" },
    { value: "Kansas", color: "#F59E0B", icon: "MapPin" },
    { value: "Kentucky", color: "#2563EB", icon: "MapPin" },
    { value: "Louisiana", color: "#7C3AED", icon: "MapPin" },
    { value: "Maine", color: "#16A34A", icon: "MapPin" },
    { value: "Maryland", color: "#DC2626", icon: "MapPin" },
    { value: "Massachusetts", color: "#1D4ED8", icon: "MapPin" },
    { value: "Michigan", color: "#1B2A4A", icon: "MapPin" },
    { value: "Minnesota", color: "#0284C7", icon: "MapPin" },
    { value: "Mississippi", color: "#DC2626", icon: "MapPin" },
    { value: "Missouri", color: "#2563EB", icon: "MapPin" },
    { value: "Montana", color: "#EAB308", icon: "MapPin" },
    { value: "Nebraska", color: "#DC2626", icon: "MapPin" },
    { value: "Nevada", color: "#6B7280", icon: "MapPin" },
    { value: "New Hampshire", color: "#1D4ED8", icon: "MapPin" },
    { value: "New Jersey", color: "#F59E0B", icon: "MapPin" },
    { value: "New Mexico", color: "#F97316", icon: "MapPin" },
    { value: "New York", color: "#2563EB", icon: "MapPin" },
    { value: "North Carolina", color: "#0284C7", icon: "MapPin" },
    { value: "North Dakota", color: "#16A34A", icon: "MapPin" },
    { value: "Ohio", color: "#DC2626", icon: "MapPin" },
    { value: "Oklahoma", color: "#F97316", icon: "MapPin" },
    { value: "Oregon", color: "#16A34A", icon: "MapPin" },
    { value: "Pennsylvania", color: "#1B2A4A", icon: "MapPin" },
    { value: "Rhode Island", color: "#0284C7", icon: "MapPin" },
    { value: "South Carolina", color: "#1D4ED8", icon: "MapPin" },
    { value: "South Dakota", color: "#2563EB", icon: "MapPin" },
    { value: "Tennessee", color: "#F97316", icon: "MapPin" },
    { value: "Texas", color: "#DC2626", icon: "MapPin" },
    { value: "Utah", color: "#EAB308", icon: "MapPin" },
    { value: "Vermont", color: "#16A34A", icon: "MapPin" },
    { value: "Virginia", color: "#1B2A4A", icon: "MapPin" },
    { value: "Washington", color: "#16A34A", icon: "MapPin" },
    { value: "West Virginia", color: "#EAB308", icon: "MapPin" },
    { value: "Wisconsin", color: "#DC2626", icon: "MapPin" },
    { value: "Wyoming", color: "#9A3412", icon: "MapPin" },
  ],

  "Job Stage": [
    { value: "Pending", color: "#6B7280", icon: "Clock" },
    { value: "Scheduled", color: "#3B82F6", icon: "CalendarCheck" },
    { value: "Waiting For Material", color: "#F59E0B", icon: "PackageSearch" },
    { value: "Ready For Plotting", color: "#7C3AED", icon: "Scissors" },
    { value: "Disassemble", color: "#F97316", icon: "Wrench" },
    { value: "Washing", color: "#0EA5E9", icon: "Droplets" },
    { value: "Surface Prep", color: "#0891B2", icon: "SprayCan" },
    { value: "Installing Ppf", color: "#E8601C", icon: "Shield" },
    { value: "Installing Tint", color: "#1B2A4A", icon: "SunDim" },
    { value: "Installing Wpf", color: "#6366F1", icon: "Film" },
    { value: "Installing Vinyl", color: "#A855F7", icon: "Layers" },
    { value: "Installing Ceramic", color: "#14B8A6", icon: "Gem" },
    { value: "Reassemble", color: "#059669", icon: "Wrench" },
    { value: "Quality Check", color: "#CA8A04", icon: "ClipboardCheck" },
    { value: "Final Cleaning", color: "#10B981", icon: "Sparkles" },
    { value: "Ready For Pickup", color: "#22C55E", icon: "CircleCheck" },
  ],

  "Vehicle Make": [
    { value: "Acura", color: "#374151", icon: "Car" },
    { value: "Alfa Romeo", color: "#991B1B", icon: "Car" },
    { value: "Aston Martin", color: "#16A34A", icon: "Car" },
    { value: "Audi", color: "#374151", icon: "Car" },
    { value: "Bentley", color: "#1B2A4A", icon: "Car" },
    { value: "BMW", color: "#2563EB", icon: "Car" },
    { value: "Buick", color: "#6B7280", icon: "Car" },
    { value: "Cadillac", color: "#111827", icon: "Car" },
    { value: "Chevrolet", color: "#EAB308", icon: "Car" },
    { value: "Chrysler", color: "#1D4ED8", icon: "Car" },
    { value: "Dodge", color: "#DC2626", icon: "Car" },
    { value: "Ferrari", color: "#DC2626", icon: "Car" },
    { value: "Fiat", color: "#991B1B", icon: "Car" },
    { value: "Ford", color: "#1D4ED8", icon: "Car" },
    { value: "Genesis", color: "#111827", icon: "Car" },
    { value: "GMC", color: "#DC2626", icon: "Truck" },
    { value: "Honda", color: "#DC2626", icon: "Car" },
    { value: "Hyundai", color: "#1D4ED8", icon: "Car" },
    { value: "Infiniti", color: "#374151", icon: "Car" },
    { value: "Jaguar", color: "#16A34A", icon: "Car" },
    { value: "Jeep", color: "#16A34A", icon: "Truck" },
    { value: "Kia", color: "#DC2626", icon: "Car" },
    { value: "Lamborghini", color: "#EAB308", icon: "Car" },
    { value: "Land Rover", color: "#16A34A", icon: "Truck" },
    { value: "Lexus", color: "#111827", icon: "Car" },
    { value: "Lincoln", color: "#1B2A4A", icon: "Car" },
    { value: "Lotus", color: "#EAB308", icon: "Car" },
    { value: "Lucid", color: "#6B7280", icon: "Car" },
    { value: "Maserati", color: "#1D4ED8", icon: "Car" },
    { value: "Mazda", color: "#DC2626", icon: "Car" },
    { value: "McLaren", color: "#F97316", icon: "Car" },
    { value: "Mercedes-Benz", color: "#374151", icon: "Car" },
    { value: "Mini", color: "#111827", icon: "Car" },
    { value: "Mitsubishi", color: "#DC2626", icon: "Car" },
    { value: "Nissan", color: "#6B7280", icon: "Car" },
    { value: "Polestar", color: "#EAB308", icon: "Car" },
    { value: "Pontiac", color: "#DC2626", icon: "Car" },
    { value: "Porsche", color: "#111827", icon: "Car" },
    { value: "Ram", color: "#1B2A4A", icon: "Truck" },
    { value: "Rivian", color: "#16A34A", icon: "Truck" },
    { value: "Rolls-Royce", color: "#1B2A4A", icon: "Car" },
    { value: "Saab", color: "#16A34A", icon: "Car" },
    { value: "Saturn", color: "#6B7280", icon: "Car" },
    { value: "Scion", color: "#F97316", icon: "Car" },
    { value: "Subaru", color: "#2563EB", icon: "Car" },
    { value: "Suzuki", color: "#DC2626", icon: "Car" },
    { value: "Tesla", color: "#DC2626", icon: "Car" },
    { value: "Toyota", color: "#DC2626", icon: "Car" },
    { value: "Volkswagen", color: "#1D4ED8", icon: "Car" },
    { value: "Volvo", color: "#1B2A4A", icon: "Car" },
    { value: "Harley-Davidson", color: "#F97316", icon: "Bike" },
    { value: "Ducati", color: "#DC2626", icon: "Bike" },
    { value: "Yamaha", color: "#2563EB", icon: "Bike" },
    { value: "Kawasaki", color: "#16A34A", icon: "Bike" },
  ],
};

// ─── Seed logic ────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db("Nashville");
    const col = db.collection("Nashville_Options");

    for (const [name, options] of Object.entries(ALL_OPTIONS)) {
      const result = await col.updateOne(
        { name },
        {
          $set: { options, updatedAt: new Date() },
          $setOnInsert: { name, createdAt: new Date() },
        },
        { upsert: true }
      );

      const action = result.upsertedCount ? "Created" : "Updated";
      console.log(`  ✅ ${action} "${name}" → ${options.length} options`);
    }

    console.log("\n🎉 All option sets seeded successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
