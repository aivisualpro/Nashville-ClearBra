/**
 * Google Service Account helper — uses raw REST APIs (no googleapis dependency).
 * Generates a JWT, exchanges for an access token (cached 50min), and provides
 * a single `processTemplate()` function that copies→replaces→exports→cleans up.
 */

import crypto from "crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id: string;
}

function getServiceAccountKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");
  return JSON.parse(raw);
}

/** Create a signed JWT for Google's OAuth2 token endpoint. */
function createJWT(scope: string): string {
  const key = getServiceAccountKey();
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const signInput = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signInput), key.private_key);

  return `${signInput}.${signature.toString("base64url")}`;
}

// ─── Cached token (avoids re-auth per API call) ───────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) return cachedToken;

  const jwt = createJWT(
    "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents"
  );

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + 50 * 60 * 1000; // cache for 50 minutes
  return cachedToken!;
}

// ─── Internal helpers (reuse a pre-fetched token) ─────────────────────

async function copyTemplate(token: string, templateId: string, title: string): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { name: title };
  if (folderId) body.parents = [folderId];

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Copy template failed: ${res.status} ${text}`);
  }

  return (await res.json()).id;
}

async function batchReplace(token: string, docId: string, replacements: Record<string, string>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requests: any[] = [];

  for (const [key, value] of Object.entries(replacements)) {
    requests.push({
      replaceAllText: {
        containsText: { text: `{{${key}}}`, matchCase: false },
        replaceText: value || "",
      },
    });
  }

  if (requests.length === 0) return;

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Batch update failed: ${res.status} ${text}`);
  }
}

/**
 * Fetch the doc and walk its body to find every inline image whose
 * Alt-text TITLE or DESCRIPTION matches one of the requested keys.
 * Returns a map of { altText → inlineObjectId }.
 *
 * Google Docs exposes two alt-text fields on an image:
 *   - Title       (set via right-click → Alt text → Title field)
 *   - Description (set via the "Alt text" sidebar panel — the one that
 *                  says "Accessed by screen readers…")
 * We accept either, because the sidebar panel only edits Description and
 * many users will never find the Title modal.
 */
async function findImagesByAltTitle(
  token: string,
  docId: string,
  wantedTitles: string[]
): Promise<Record<string, string>> {
  if (wantedTitles.length === 0) return {};

  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${docId}?fields=inlineObjects`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get document failed: ${res.status} ${text}`);
  }

  const doc = await res.json();
  const inlineObjects = (doc.inlineObjects || {}) as Record<
    string,
    { inlineObjectProperties?: { embeddedObject?: { title?: string; description?: string } } }
  >;

  const wantedSet = new Set(wantedTitles.map((t) => t.toLowerCase()));
  const found: Record<string, string> = {};

  for (const [objectId, obj] of Object.entries(inlineObjects)) {
    const embedded = obj.inlineObjectProperties?.embeddedObject;
    const title = embedded?.title?.trim().toLowerCase();
    const description = embedded?.description?.trim().toLowerCase();

    // Either field matches → record under that key.
    if (title && wantedSet.has(title)) {
      found[title] = objectId;
      continue;
    }
    if (description && wantedSet.has(description)) {
      found[description] = objectId;
    }
  }

  return found;
}

/**
 * Replace every placeholder image (identified by its Alt-text title)
 * with the URL provided in `imageReplacements`. Silently skips any
 * titles that don't exist in the document.
 */
async function batchReplaceImages(
  token: string,
  docId: string,
  imageReplacements: Record<string, string>
): Promise<void> {
  const titles = Object.keys(imageReplacements).filter((k) => !!imageReplacements[k]);
  if (titles.length === 0) return;

  const titleToObjectId = await findImagesByAltTitle(token, docId, titles);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requests: any[] = [];
  for (const title of titles) {
    const objectId = titleToObjectId[title.toLowerCase()];
    if (!objectId) continue; // template doesn't include this placeholder
    requests.push({
      replaceImage: {
        imageObjectId: objectId,
        uri: imageReplacements[title],
        imageReplaceMethod: "CENTER_CROP",
      },
    });
  }
  if (requests.length === 0) return;

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image replace failed: ${res.status} ${text}`);
  }
}

async function exportPdf(token: string, docId: string): Promise<Buffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF export failed: ${res.status} ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function deleteTemp(token: string, fileId: string): Promise<void> {
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Process a Google Docs template: copy → replace placeholders → export PDF → cleanup.
 * Uses a single auth token for the entire pipeline.
 *
 * @param replacements        Text placeholders to swap, keyed without the `{{}}`.
 * @param imageReplacements   Optional. Maps an image's Alt-text TITLE → image URL.
 *                            For each title, the corresponding inline image in the
 *                            template is replaced (CENTER_INSIDE) with the URL.
 *                            Use this for the damage diagram: set the placeholder
 *                            image's Alt-text title to "damage_diagram" and pass
 *                            { damage_diagram: data.damageDiagramUrl }.
 */
export async function processTemplate(
  templateId: string,
  title: string,
  replacements: Record<string, string>,
  imageReplacements?: Record<string, string>
): Promise<Buffer> {
  const token = await getAccessToken();
  let tempDocId: string | null = null;

  try {
    // 1. Copy template into Shared Drive folder
    tempDocId = await copyTemplate(token, templateId, title);

    // 2. Replace all {{placeholders}} in one batch call
    await batchReplace(token, tempDocId, replacements);

    // 3. Replace any placeholder images by Alt-text title (no-op if none)
    if (imageReplacements && Object.keys(imageReplacements).length > 0) {
      await batchReplaceImages(token, tempDocId, imageReplacements);
    }

    // 4. Export as PDF
    return await exportPdf(token, tempDocId);
  } finally {
    // 5. Always clean up the temporary doc (fire-and-forget)
    if (tempDocId) {
      deleteTemp(token, tempDocId).catch(() => {});
    }
  }
}
