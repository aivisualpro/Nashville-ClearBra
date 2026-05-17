import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import https from "https";

const SLUG_MAP: Record<string, string> = {
  "Acura": "acura", "Alfa Romeo": "alfa-romeo", "Aston Martin": "aston-martin",
  "Audi": "audi", "Bentley": "bentley", "BMW": "bmw", "Buick": "buick",
  "Cadillac": "cadillac", "Chevrolet": "chevrolet", "Chrysler": "chrysler",
  "Dodge": "dodge", "Ferrari": "ferrari", "Fiat": "fiat", "Ford": "ford",
  "Genesis": "genesis", "GMC": "gmc", "Honda": "honda", "Hyundai": "hyundai",
  "Infiniti": "infiniti", "Jaguar": "jaguar", "Jeep": "jeep", "Kia": "kia",
  "Lamborghini": "lamborghini", "Land Rover": "land-rover", "Lexus": "lexus",
  "Lincoln": "lincoln", "Lotus": "lotus", "Lucid": "lucid",
  "Maserati": "maserati", "Mazda": "mazda", "McLaren": "mclaren",
  "Mercedes-Benz": "mercedes-benz", "Mini": "mini", "Mitsubishi": "mitsubishi",
  "Nissan": "nissan", "Polestar": "polestar", "Pontiac": "pontiac",
  "Porsche": "porsche", "Ram": "ram", "Rivian": "rivian",
  "Rolls-Royce": "rolls-royce", "Saab": "saab", "Saturn": "saturn",
  "Scion": "scion", "Subaru": "subaru", "Suzuki": "suzuki",
  "Tesla": "tesla", "Toyota": "toyota", "Volkswagen": "volkswagen", "Volvo": "volvo",
};

const GITHUB_BASES = [
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/",
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/",
];

function httpsGet(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGet(res.headers.location, maxRedirects - 1));
      }
      if (!res.statusCode || res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function sha1(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToCloudinary(imageBuffer: Buffer, publicId: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey    = process.env.CLOUDINARY_CLOUD_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_CLOUD_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder    = "nashville_vehicle_logos";

  const sigStr = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(sigStr);

  const boundary = "----CloudinaryBoundary" + Date.now();
  const fields: Record<string, string> = { api_key: apiKey, timestamp, signature, folder, public_id: publicId, overwrite: "true" };
  let body = "";
  for (const [k, v] of Object.entries(fields)) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
  }
  body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${publicId}.png"\r\nContent-Type: image/png\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const bodyBuf = Buffer.concat([Buffer.from(body, "utf-8"), imageBuffer, Buffer.from(tail, "utf-8")]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.cloudinary.com",
      path: `/v1_1/${cloudName}/image/upload`,
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": bodyBuf.length },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
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

export async function POST() {
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) return NextResponse.json({ success: false, message: "DB not connected" }, { status: 500 });

    const col = db.collection("Nashville_Make");
    const makes = await col.find({}).sort({ vehicleMake: 1 }).toArray();
    const results: { make: string; status: string; url?: string }[] = [];

    for (const make of makes) {
      const name: string = make.vehicleMake || "";
      const slug = SLUG_MAP[name];

      if (make.logo && typeof make.logo === "string" && make.logo.includes("cloudinary.com")) {
        results.push({ make: name, status: "already_set", url: make.logo });
        continue;
      }
      if (!slug) { results.push({ make: name, status: "no_slug" }); continue; }

      let imageBuffer: Buffer | null = null;
      for (const base of GITHUB_BASES) {
        try { imageBuffer = await httpsGet(`${base}${slug}.png`); break; } catch { /* next */ }
      }
      if (!imageBuffer) { results.push({ make: name, status: "download_failed" }); continue; }

      try {
        const pubId = `make_${slug.replace(/-/g, "_")}`;
        const cloudUrl = await uploadToCloudinary(imageBuffer, pubId);
        await col.updateOne({ _id: make._id }, { $set: { logo: cloudUrl } });
        results.push({ make: name, status: "ok", url: cloudUrl });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "error";
        results.push({ make: name, status: `upload_failed: ${msg}` });
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const skipped = results.filter((r) => r.status === "already_set").length;
    const failed = results.filter((r) => !["ok", "already_set"].includes(r.status)).length;
    return NextResponse.json({ success: true, ok, skipped, failed, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
