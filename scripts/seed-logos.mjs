#!/usr/bin/env node
/**
 * Standalone script: Downloads car logos from GitHub, uploads to Cloudinary,
 * saves the URL to Nashville_Make.logo in MongoDB.
 *
 * Usage:  node scripts/seed-logos.mjs
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
  console.log("Loaded .env.local");
}

// ── Config ────────────────────────────────────────────────────────────────────
const MONGODB_URI  = process.env.NASHVILLE_MONGODB_URI || process.env.MONGODB_URI;
const CLOUD_NAME   = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY      = process.env.CLOUDINARY_CLOUD_API_KEY;
const API_SECRET   = process.env.CLOUDINARY_CLOUD_API_SECRET;

if (!MONGODB_URI || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing env vars. Need: NASHVILLE_MONGODB_URI (or MONGODB_URI), CLOUDINARY_CLOUD_NAME, CLOUDINARY_CLOUD_API_KEY, CLOUDINARY_CLOUD_API_SECRET");
  process.exit(1);
}

// ── GitHub sources (tried in order) ───────────────────────────────────────────
const GITHUB_BASES = [
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/",
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/",
];

// Make name → filename slug
const SLUG_MAP = {
  "Acura": "acura",
  "Alfa Romeo": "alfa-romeo",
  "Aston Martin": "aston-martin",
  "Audi": "audi",
  "Bentley": "bentley",
  "BMW": "bmw",
  "Buick": "buick",
  "Cadillac": "cadillac",
  "Chevrolet": "chevrolet",
  "Chrysler": "chrysler",
  "Dodge": "dodge",
  "Ferrari": "ferrari",
  "Fiat": "fiat",
  "Ford": "ford",
  "Genesis": "genesis",
  "GMC": "gmc",
  "Honda": "honda",
  "Hyundai": "hyundai",
  "Infiniti": "infiniti",
  "Jaguar": "jaguar",
  "Jeep": "jeep",
  "Kia": "kia",
  "Lamborghini": "lamborghini",
  "Land Rover": "land-rover",
  "Lexus": "lexus",
  "Lincoln": "lincoln",
  "Lotus": "lotus",
  "Lucid": "lucid",
  "Maserati": "maserati",
  "Mazda": "mazda",
  "McLaren": "mclaren",
  "Mercedes-Benz": "mercedes-benz",
  "Mini": "mini",
  "Mitsubishi": "mitsubishi",
  "Nissan": "nissan",
  "Polestar": "polestar",
  "Pontiac": "pontiac",
  "Porsche": "porsche",
  "Ram": "ram",
  "Rivian": "rivian",
  "Rolls-Royce": "rolls-royce",
  "Saab": "saab",
  "Saturn": "saturn",
  "Scion": "scion",
  "Subaru": "subaru",
  "Suzuki": "suzuki",
  "Tesla": "tesla",
  "Toyota": "toyota",
  "Volkswagen": "volkswagen",
  "Volvo": "volvo",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function httpsGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGet(res.headers.location, maxRedirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function sha1(str) {
  const buf = await globalThis.crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToCloudinary(imageBuffer, publicId) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "nashville_vehicle_logos";
  const sigStr = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(sigStr);

  const boundary = "----CloudinaryBoundary" + Date.now();
  const fields = {
    api_key: API_KEY,
    timestamp,
    signature,
    folder,
    public_id: publicId,
    overwrite: "true",
  };

  // Build multipart body manually
  let body = "";
  for (const [k, v] of Object.entries(fields)) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
  }
  body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${publicId}.png"\r\nContent-Type: image/png\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const bodyBuf = Buffer.concat([
    Buffer.from(body, "utf-8"),
    imageBuffer,
    Buffer.from(tail, "utf-8"),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.cloudinary.com",
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": bodyBuf.length,
      },
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const json = JSON.parse(Buffer.concat(chunks).toString());
        if (json.secure_url) resolve(json.secure_url);
        else reject(new Error(json.error?.message || JSON.stringify(json)));
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection("Nashville_Make");
  const makes = await col.find({}).sort({ vehicleMake: 1 }).toArray();
  console.log(`Found ${makes.length} makes.\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (const make of makes) {
    const name = make.vehicleMake || "";
    const slug = SLUG_MAP[name];

    // Skip if already done
    if (make.logo && make.logo.includes("cloudinary.com")) {
      console.log(`  ✓ ${name} — already set`);
      skipped++;
      continue;
    }

    if (!slug) {
      console.log(`  ✗ ${name} — no slug mapped`);
      failed++;
      continue;
    }

    let imageBuffer = null;
    for (const base of GITHUB_BASES) {
      const url = `${base}${slug}.png`;
      try {
        imageBuffer = await httpsGet(url);
        break;
      } catch {
        // try next base
      }
    }

    if (!imageBuffer) {
      console.log(`  ✗ ${name} — could not download from any source`);
      failed++;
      continue;
    }

    try {
      const pubId = `make_${slug.replace(/-/g, "_")}`;
      const cloudUrl = await uploadToCloudinary(imageBuffer, pubId);
      await col.updateOne({ _id: make._id }, { $set: { logo: cloudUrl } });
      console.log(`  ✓ ${name} → ${cloudUrl}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${name} — upload failed: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone! OK: ${ok}, Skipped: ${skipped}, Failed: ${failed}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
