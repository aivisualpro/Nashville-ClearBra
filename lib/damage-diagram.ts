/**
 * Generates a damage diagram PNG by overlaying numbered colored pins onto
 * a static multi-view car schematic (public/damage-diagram-base.png).
 *
 * For each pin we pick which of the 5 views (Front, Rear, Top, Left, Right)
 * it belongs on based on its surface normal, then project the 3D world
 * position into the matching view's pixel bounding box on the static image.
 *
 * Returns a PNG Blob ready for upload to Cloudinary.
 *
 * Browser-only (uses HTMLCanvasElement + Image()).
 */

import type { DamagePin } from "@/components/intake/steps/car-damage-marker-types";
import type { BodyStyle } from "@/components/intake/car-damage-marker";

const BASE_IMAGE_URL = "/damage-diagram-base.png";
// Native dimensions of the source PNG. Update if you swap the base image.
const BASE_W = 2748;
const BASE_H = 1850;

// Severity → color
const SEVERITY_COLORS: Record<DamagePin["severity"], string> = {
  minor:    "#facc15", // yellow
  moderate: "#f97316", // orange
  severe:   "#ef4444", // red
};

// ─── View bounding boxes (pixel coords on the base image) ────────────
// Calibrated from the uploaded 2748×1850 multi-view schematic.
// Tweak any of these {x, y, w, h} if a view's pins drift off the car.
type ViewName = "front" | "rear" | "top" | "left" | "right";

interface ViewBox {
  bbox: { x: number; y: number; w: number; h: number };
}

const VIEW_BOXES: Record<ViewName, ViewBox> = {
  front: { bbox: { x: 80,   y: 30,   w: 660,  h: 470  } },
  rear:  { bbox: { x: 800,  y: 30,   w: 540,  h: 470  } },
  top:   { bbox: { x: 1790, y: 30,   w: 940,  h: 1780 } },
  left:  { bbox: { x: 80,   y: 540,  w: 1680, h: 510  } },
  right: { bbox: { x: 80,   y: 1100, w: 1680, h: 620  } },
};

// ─── World coordinate ranges ─────────────────────────────────────────
// The GLBs (car.glb, suv.glb) use the convention:
//   +Z = car's FRONT, -Z = REAR    (length axis)
//   +X = car's LEFT  side, -X = RIGHT side  (width axis, right-handed)
//   +Y = UP                          (height)
// After CarDamageMarker.GlbCar auto-fits to ~4.2m length, pin coords land
// within these ranges. (Both sedan and SUV end up ±1.1 wide, ±2.1 long.)
const WORLD = {
  xMin: -1.1,   xMax:  1.1,    // width:  -X right side,   +X left side
  yMin:  0.0,   yMax:  1.6,    // height: 0 ground,        +Y up
  zMin: -2.1,   zMax:  2.1,    // length: -Z rear,         +Z front
};

// ─── Per-view projection (world XYZ → normalized [u, v] in [0,1]) ────
// u is horizontal (0=left, 1=right) within the view's bbox.
// v is vertical (0=top,  1=bottom) within the view's bbox.
const PROJECTORS: Record<ViewName, (p: [number, number, number]) => [number, number]> = {
  // FRONT: viewer faces the car. Car's LEFT side (+X) shows on viewer's RIGHT.
  front: (p) => [
    norm(p[0], WORLD.xMin, WORLD.xMax),                  // u: +X (car left)  → image right
    1 - norm(p[1], WORLD.yMin, WORLD.yMax),              // v: +Y up
  ],
  // REAR: viewer stands behind. Car's RIGHT side (-X) shows on viewer's RIGHT.
  rear: (p) => [
    1 - norm(p[0], WORLD.xMin, WORLD.xMax),              // u: -X (car right) → image right
    1 - norm(p[1], WORLD.yMin, WORLD.yMax),              // v: +Y up
  ],
  // TOP: looking straight down, front of car at TOP of image.
  //   image top    = car's FRONT (+Z)
  //   image right  = car's RIGHT side (-X) — same as standing behind the car
  top: (p) => [
    1 - norm(p[0], WORLD.xMin, WORLD.xMax),              // u: -X → image right
    1 - norm(p[2], WORLD.zMin, WORLD.zMax),              // v: +Z (front) → top (v=0)
  ],
  // LEFT SIDE (upper big view — front faces RIGHT in the schematic):
  //   viewer on car's LEFT (+X), so car's FRONT (+Z) is on viewer's RIGHT.
  left: (p) => [
    norm(p[2], WORLD.zMin, WORLD.zMax),                  // u: +Z (front) → image right
    1 - norm(p[1], WORLD.yMin, WORLD.yMax),              // v: +Y up
  ],
  // RIGHT SIDE (lower big view — front faces LEFT in the schematic):
  //   viewer on car's RIGHT (-X), so car's FRONT (+Z) is on viewer's LEFT.
  right: (p) => [
    1 - norm(p[2], WORLD.zMin, WORLD.zMax),              // u: -Z (rear) → image right
    1 - norm(p[1], WORLD.yMin, WORLD.yMax),              // v: +Y up
  ],
};

function norm(v: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

// ─── Pick which view a pin lands on based on its surface normal ──────
// Normals point OUT of the clicked surface. So a pin on the windshield has
// normal mostly +Y (up) → top view; a pin on the driver door has normal +X
// (out the left side) → left view; etc.
function pickView(normal: [number, number, number]): ViewName {
  const [nx, ny, nz] = normal;
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  if (ay >= ax && ay >= az) return "top";
  if (az >= ax) return nz > 0 ? "front" : "rear";   // +Z = front of car
  return nx > 0 ? "left" : "right";                  // +X = car's left side
}

// ─── Image cache (loaded once per page session) ──────────────────────
let cachedImage: Promise<HTMLImageElement> | null = null;
function loadBaseImage(): Promise<HTMLImageElement> {
  if (!cachedImage) {
    cachedImage = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${BASE_IMAGE_URL}`));
      img.src = BASE_IMAGE_URL;
    });
  }
  return cachedImage;
}

// ─── Public API ─────────────────────────────────────────────────────
export interface GenerateDiagramOpts {
  pins: DamagePin[];
  bodyStyle: BodyStyle;   // accepted for API compat; doesn't change output
  /** Reserved for future use. Currently unused (base image is a fixed schematic). */
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
}

export async function generateDamageDiagram(
  opts: GenerateDiagramOpts
): Promise<Blob> {
  const { pins } = opts;

  // ── 1. Load static base image ──
  const baseImg = await loadBaseImage();

  // ── 2. Create the output canvas at native resolution ──
  const canvas = document.createElement("canvas");
  canvas.width = BASE_W;
  canvas.height = BASE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D canvas context");

  // Draw the base schematic
  ctx.drawImage(baseImg, 0, 0, BASE_W, BASE_H);

  // ── 3. Project + draw each pin ──
  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    const viewName = pickView(pin.normal);
    const view = VIEW_BOXES[viewName];
    const project = PROJECTORS[viewName];

    const [u, v] = project(pin.position);
    const px = view.bbox.x + u * view.bbox.w;
    const py = view.bbox.y + v * view.bbox.h;

    drawPin(ctx, px, py, i + 1, SEVERITY_COLORS[pin.severity]);
  }

  // ── 4. Export PNG ──
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas.toBlob returned null"))),
      "image/png"
    );
  });
}

// ─── Pin drawing ────────────────────────────────────────────────────
function drawPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  num: number,
  color: string
) {
  const R_HALO = 56;
  const R_DISC = 44;

  ctx.save();
  // Outer translucent halo for legibility on any background (black or white)
  ctx.beginPath();
  ctx.arc(x, y, R_HALO, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  // Colored disc
  ctx.beginPath();
  ctx.arc(x, y, R_DISC, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // Number label
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), x, y + 1);
  ctx.restore();
}
