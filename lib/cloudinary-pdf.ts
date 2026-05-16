/**
 * Upload a PDF buffer to Cloudinary and return the secure URL.
 * Uses Cloudinary's raw upload endpoint (not image).
 */
export async function uploadPdfToCloudinary(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_CLOUD_API_KEY;
  const apiSecret = process.env.CLOUDINARY_CLOUD_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "nashville_work_orders";
  const publicId = fileName; // just the file name, folder param handles the path
  const signString = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

  // SHA-1 signature
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(signString));
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Build form data with the raw PDF buffer
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  const form = new FormData();
  form.append("file", blob, `${fileName}.pdf`);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("resource_type", "raw");
  form.append("overwrite", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: "POST", body: form }
  );

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }

  return result.secure_url;
}
