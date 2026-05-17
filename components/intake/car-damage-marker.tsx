"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Edges, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { DamagePin } from "./steps/car-damage-marker-types";

export type { DamagePin };

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#facc15",
  moderate: "#f97316",
  severe: "#ef4444",
};

const DAMAGE_TYPES = [
  { value: "scratch", label: "Scratch" },
  { value: "dent", label: "Dent" },
  { value: "paint_chip", label: "Paint Chip" },
  { value: "broken", label: "Broken" },
  { value: "glass", label: "Glass" },
  { value: "other", label: "Other" },
];

// ─── Blueprint look constants ────────────────────────────────────────
const PANEL_FILL = "#bfe1f5";   // light cyan-blue translucent fill
const EDGE_COLOR = "#1e5b8e";   // deep blue edge lines
const GLASS_FILL = "#9ed8f5";
const WHEEL_RIM = "#9ca3af";
const TIRE_DARK = "#1f2937";
const HEAD_GLOW = "#22d3ee";    // cyan headlight glow
const REAR_GLOW = "#ef4444";

// Real car models in /public, keyed by body style.
export type BodyStyle = "sedan" | "suv";
const USE_GLB = true;
const MODELS: Record<BodyStyle, string> = {
  sedan: "/car.glb",
  suv: "/suv.glb",
};

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {/* Tire */}
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 32]} />
        <meshPhysicalMaterial
          color={TIRE_DARK}
          transparent
          opacity={0.28}
          roughness={0.6}
          depthWrite={false}
        />
        <Edges threshold={25} color={EDGE_COLOR} />
      </mesh>
      {/* Rim */}
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.24, 18]} />
        <meshStandardMaterial color={WHEEL_RIM} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Hub cap */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.26, 12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

// ─── Curved SUV body (extruded side profile, not boxes) ──────────────
// We trace the side silhouette as a 2D Shape with quadratic curves for the
// hood, windshield, roof, hatch, and bumpers, then extrude it across the
// car's width with a bevel for soft edges. Result is a real car-shaped
// volume, not a stack of boxes.
function useSuvGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    // X = car length (negative = front, positive = rear)
    // Y = height from ground.
    // ── Trace the upper outline clockwise (front-bottom → over the top → rear-bottom) ──
    s.moveTo(-2.05, 0.5);                                       // front bumper bottom
    s.lineTo(-2.05, 0.82);                                      // bumper face
    s.quadraticCurveTo(-2.02, 1.08, -1.75, 1.15);               // headlight pocket
    s.quadraticCurveTo(-1.45, 1.22, -1.15, 1.22);               // hood front edge
    s.lineTo(-0.55, 1.24);                                      // hood top
    s.quadraticCurveTo(-0.3, 1.28, -0.15, 1.65);                // windshield base
    s.lineTo(0.08, 1.88);                                       // windshield top
    s.lineTo(1.15, 1.9);                                        // roof
    s.lineTo(1.4, 1.82);                                        // roof end (slight slope)
    s.quadraticCurveTo(1.75, 1.65, 1.9, 1.12);                  // rear hatch glass
    s.lineTo(2.05, 1.05);                                       // hatch lower
    s.quadraticCurveTo(2.15, 0.92, 2.1, 0.72);                  // rear bumper top
    s.lineTo(2.1, 0.5);                                         // rear bumper bottom

    // ── Bottom outline with wheel arches (rear → front, X decreasing) ──
    // Each arch is a semicircle bulging UP into the body so the wheels tuck under.
    s.lineTo(1.72, 0.5);                                        // approach rear arch (right side)
    s.absarc(1.3, 0.5, 0.42, 0, Math.PI, false);                // rear wheel arch ↑
    s.lineTo(-0.88, 0.5);                                       // floor between axles
    s.absarc(-1.3, 0.5, 0.42, 0, Math.PI, false);               // front wheel arch ↑
    s.lineTo(-2.05, 0.5);                                       // close back to start

    const geom = new THREE.ExtrudeGeometry(s, {
      depth: 1.75,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.07,
      bevelSegments: 4,
      curveSegments: 32,
    });
    geom.translate(0, 0, -0.875);   // center on Z
    geom.computeVertexNormals();
    return geom;
  }, []);
}

function ProceduralSuv() {
  const bodyGeom = useSuvGeometry();

  return (
    <group>
      {/* ── Main body (curved extruded silhouette) ── */}
      <mesh geometry={bodyGeom}>
        <meshPhysicalMaterial
          color={PANEL_FILL}
          transparent
          opacity={0.16}
          transmission={0.55}
          roughness={0.12}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
          depthWrite={false}
        />
        <Edges threshold={20} color={EDGE_COLOR} />
      </mesh>

      {/* ── Side window glass overlays (left + right) ── */}
      {[0.89, -0.89].map((z) => (
        <mesh key={`sw-${z}`} position={[0.5, 1.55, z]}>
          <boxGeometry args={[1.6, 0.42, 0.01]} />
          <meshPhysicalMaterial
            color={GLASS_FILL}
            transparent
            opacity={0.28}
            transmission={0.6}
            roughness={0.05}
            depthWrite={false}
          />
          <Edges threshold={15} color={EDGE_COLOR} />
        </mesh>
      ))}

      {/* ── Front grille (decorative crosshatch) ── */}
      <mesh position={[-2.12, 0.95, 0]}>
        <boxGeometry args={[0.02, 0.28, 0.9]} />
        <meshStandardMaterial color={EDGE_COLOR} transparent opacity={0.45} />
        <Edges threshold={15} color={EDGE_COLOR} />
      </mesh>

      {/* ── Side mirrors ── */}
      {[0.97, -0.97].map((z) => (
        <mesh key={`m-${z}`} position={[-0.3, 1.32, z]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial
            color={PANEL_FILL}
            transparent
            opacity={0.4}
            transmission={0.3}
            depthWrite={false}
          />
          <Edges threshold={15} color={EDGE_COLOR} />
        </mesh>
      ))}

      {/* ── Door split lines ── */}
      {[0.89, -0.89].map((z) => (
        <mesh key={`dl-${z}`} position={[0.2, 1.0, z]}>
          <boxGeometry args={[0.015, 0.7, 0.01]} />
          <meshBasicMaterial color={EDGE_COLOR} />
        </mesh>
      ))}

      {/* ── Headlights ── */}
      {[0.6, -0.6].map((z) => (
        <group key={`hl-${z}`} position={[-2.05, 1.05, z]}>
          <mesh>
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshStandardMaterial
              color={HEAD_GLOW}
              emissive={HEAD_GLOW}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshBasicMaterial
              color={HEAD_GLOW}
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* ── Taillights ── */}
      {[0.6, -0.6].map((z) => (
        <mesh key={`tl-${z}`} position={[2.13, 1.05, z]}>
          <boxGeometry args={[0.04, 0.16, 0.36]} />
          <meshStandardMaterial
            color={REAR_GLOW}
            emissive={REAR_GLOW}
            emissiveIntensity={0.7}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── Wheels (4 — tucked into the new wheel arches) ── */}
      <Wheel position={[-1.3, 0.32, 0.92]} />
      <Wheel position={[-1.3, 0.32, -0.92]} />
      <Wheel position={[1.3, 0.32, 0.92]} />
      <Wheel position={[1.3, 0.32, -0.92]} />
    </group>
  );
}

// ─── GLB-loaded car (photorealistic, with blueprint wireframe overlay) ─
// Loads /public/suv.glb, auto-fits it to ~4.2m length, centers on origin,
// reskins every mesh with the translucent blueprint material, and adds
// EdgesGeometry line overlays so the wireframe look from the reference
// image carries over to the real model.
function GlbCar({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const copy = scene.clone(true);

    // ── Auto-fit: compute bounding box, scale to ~4.2m length ──
    const box = new THREE.Box3().setFromObject(copy);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.z);
    if (longest > 0) {
      const targetLength = 4.2;
      copy.scale.setScalar(targetLength / longest);
    }
    copy.updateMatrixWorld(true);

    // Re-compute box after scaling and recenter on origin (sit on y=0)
    const box2 = new THREE.Box3().setFromObject(copy);
    const center = box2.getCenter(new THREE.Vector3());
    copy.position.x -= center.x;
    copy.position.z -= center.z;
    copy.position.y -= box2.min.y;

    // ── Blueprint material + edge overlay on every mesh ──
    copy.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: PANEL_FILL,
          transparent: true,
          opacity: 0.18,
          transmission: 0.55,
          roughness: 0.12,
          clearcoat: 0.5,
          depthWrite: false,
        });
        mesh.castShadow = true;

        // Add a child LineSegments for the wireframe edges.
        // threshold = 20° — only shows real geometric edges, not coplanar
        // triangulation lines.
        const edgeGeom = new THREE.EdgesGeometry(mesh.geometry, 20);
        const edgeMat = new THREE.LineBasicMaterial({
          color: EDGE_COLOR,
          transparent: true,
          opacity: 0.9,
        });
        const lines = new THREE.LineSegments(edgeGeom, edgeMat);
        // userData flag so the click-handler skips line raycasts
        lines.userData.isEdgeOverlay = true;
        lines.raycast = () => {}; // make edges non-interactive
        mesh.add(lines);
      }
    });

    return copy;
  }, [scene]);

  return <primitive object={cloned} />;
}
// Preload both models in parallel (so a toggle switch is instant after first
// load). Only fires when GLB mode is enabled.
if (USE_GLB) {
  useGLTF.preload(MODELS.sedan);
  useGLTF.preload(MODELS.suv);
}

function CarBody({ bodyStyle }: { bodyStyle: BodyStyle }) {
  if (USE_GLB) {
    return (
      <Suspense fallback={<ProceduralSuv />}>
        {/* key forces a remount when switching models so useGLTF re-resolves */}
        <GlbCar key={bodyStyle} url={MODELS[bodyStyle]} />
      </Suspense>
    );
  }
  return <ProceduralSuv />;
}

// ─── Pin marker in 3D space (flat numbered badge only) ──────────────
function PinMarker({
  pin,
  isSelected,
  onClick,
}: {
  pin: DamagePin;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = SEVERITY_COLORS[pin.severity] || "#facc15";
  const label = pin.id.replace("pin-", "");

  return (
    <group position={pin.position}>
      {/* HTML badge — sits at the exact 3D click point, always faces camera,
          stays the same screen size regardless of zoom. */}
      <Html
        center
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            pointerEvents: "auto",
            cursor: "pointer",
            background: color,
            color: "#1B2A4A",
            width: isSelected ? 28 : 24,
            height: isSelected ? 28 : 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isSelected ? 13 : 12,
            fontWeight: 700,
            border: "2px solid #ffffff",
            boxShadow: isSelected
              ? "0 0 0 3px rgba(30,91,142,0.45), 0 2px 6px rgba(0,0,0,0.35)"
              : "0 1px 4px rgba(0,0,0,0.35)",
            transition: "width 0.12s, height 0.12s, font-size 0.12s",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

// ─── Scene with click-to-pin ────────────────────────────────────────
function Scene({
  pins,
  selectedPin,
  onAddPin,
  onSelectPin,
  bodyStyle,
}: {
  pins: DamagePin[];
  selectedPin: string | null;
  onAddPin: (pos: [number, number, number], normal: [number, number, number]) => void;
  onSelectPin: (id: string) => void;
  bodyStyle: BodyStyle;
}) {
  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      // ── Drag guard ──
      // r3f exposes `delta` = pixels the pointer moved between pointerdown
      // and pointerup. If the user was orbiting (any meaningful movement),
      // this is NOT a click — bail out so we don't drop a stray pin.
      if (typeof e.delta === "number" && e.delta > 4) return;
      // Don't add pin if clicking on existing pin
      if (e.object?.userData?.isPin) return;
      e.stopPropagation();
      const point = e.point;
      const normal = e.face?.normal || new THREE.Vector3(0, 1, 0);
      const worldNormal = normal.clone().transformDirection(e.object.matrixWorld);
      const pinPos: [number, number, number] = [
        point.x + worldNormal.x * 0.05,
        point.y + worldNormal.y * 0.05,
        point.z + worldNormal.z * 0.05,
      ];
      onAddPin(pinPos, [worldNormal.x, worldNormal.y, worldNormal.z]);
    },
    [onAddPin]
  );

  return (
    <>
      {/* Bright, even blueprint-style lighting (no HDR — CSP-safe) */}
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#ffffff", "#cbd5e1", 0.6]} />
      <directionalLight position={[6, 9, 5]} intensity={0.7} />
      <directionalLight position={[-6, 5, -4]} intensity={0.45} />

      <group onClick={handleClick}>
        <CarBody bodyStyle={bodyStyle} />
      </group>

      {pins.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={pin}
          isSelected={selectedPin === pin.id}
          onClick={() => onSelectPin(pin.id)}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3.5}
        maxDistance={11}
        target={[0, 1.1, 0]}
      />

      {/* Soft circular contact shadow under the car (no dark ground plane) */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={9}
        blur={2.4}
        far={3}
        resolution={512}
        color="#1e3a5f"
      />
    </>
  );
}

// ─── Main exported component ────────────────────────────────────────
interface CarDamageMarkerProps {
  pins: DamagePin[];
  onChange: (pins: DamagePin[]) => void;
  bodyStyle?: BodyStyle;
  onBodyStyleChange?: (s: BodyStyle) => void;
}

export default function CarDamageMarker({
  pins,
  onChange,
  bodyStyle: bodyStyleProp,
  onBodyStyleChange,
}: CarDamageMarkerProps) {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  // Local state used only when no controlled prop is provided (standalone use)
  const [localBodyStyle, setLocalBodyStyle] = useState<BodyStyle>(bodyStyleProp ?? "sedan");
  const bodyStyle: BodyStyle = bodyStyleProp ?? localBodyStyle;
  const setBodyStyle = (s: BodyStyle) => {
    if (onBodyStyleChange) onBodyStyleChange(s);
    else setLocalBodyStyle(s);
  };

  const addPin = useCallback(
    (pos: [number, number, number], normal: [number, number, number]) => {
      const newPin: DamagePin = {
        id: `pin-${pins.length + 1}`,
        position: pos,
        normal,
        type: "scratch",
        severity: "minor",
        notes: "",
      };
      onChange([...pins, newPin]);
      setSelectedPin(newPin.id);
    },
    [pins, onChange]
  );

  const updatePin = (id: string, updates: Partial<DamagePin>) => {
    onChange(pins.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePin = (id: string) => {
    onChange(pins.filter((p) => p.id !== id));
    if (selectedPin === id) setSelectedPin(null);
  };

  return (
    <div style={{ display: "flex", gap: "1rem", minHeight: 400 }}>
      {/* 3D Canvas */}
      <div
        style={{
          flex: "1 1 60%",
          borderRadius: "0.75rem",
          overflow: "hidden",
          border: "1px solid #d1d5db",
          background:
            "radial-gradient(ellipse at center, #ffffff 0%, #eaf2f8 70%, #d9e4ee 100%)",
          position: "relative",
        }}
      >
        <Canvas
          shadows
          camera={{ position: [-6, 3.8, 5], fov: 36 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", minHeight: 400, background: "transparent" }}
        >
          <Scene
            pins={pins}
            selectedPin={selectedPin}
            onAddPin={addPin}
            onSelectPin={setSelectedPin}
            bodyStyle={bodyStyle}
          />
        </Canvas>

        {/* ── Body-style toggle (top-right of viewer) ── */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            gap: 4,
            padding: 4,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
            border: "1px solid #d9e4ee",
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          {(["sedan", "suv"] as const).map((s) => {
            const active = bodyStyle === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setBodyStyle(s)}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "#1e5b8e" : "transparent",
                  color: active ? "#fff" : "#1e3a5f",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {s === "sedan" ? "Sedan" : "SUV"}
              </button>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
            color: "#1e3a5f",
            fontSize: "0.7rem",
            padding: "4px 10px",
            borderRadius: 6,
            pointerEvents: "none",
            border: "1px solid #d9e4ee",
            fontWeight: 500,
          }}
        >
          Click on car to add pin • Drag to orbit • Scroll to zoom
        </div>
      </div>

      {/* Damage notes panel */}
      <div
        style={{
          flex: "1 1 40%",
          maxHeight: 500,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {pins.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#9ca3af",
              fontSize: "0.85rem",
            }}
          >
            Click on the 3D car to mark damage locations
          </div>
        )}
        {pins.map((pin) => {
          const isActive = selectedPin === pin.id;
          return (
            <div
              key={pin.id}
              onClick={() => setSelectedPin(pin.id)}
              style={{
                border: `2px solid ${isActive ? SEVERITY_COLORS[pin.severity] : "#e5e7eb"}`,
                borderRadius: "0.5rem",
                padding: "0.75rem",
                cursor: "pointer",
                transition: "border-color 0.2s",
                background: isActive ? "rgba(231,112,0,0.03)" : "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: 22, height: 22,
                      borderRadius: "50%",
                      background: SEVERITY_COLORS[pin.severity],
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                    }}
                  >
                    {pin.id.replace("pin-", "")}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1B2A4A" }}>
                    Damage #{pin.id.replace("pin-", "")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deletePin(pin.id); }}
                  style={{
                    border: "none", background: "none", color: "#9ca3af",
                    cursor: "pointer", fontSize: "1rem", padding: 0,
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
              {/* Type */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <select
                  value={pin.type}
                  onChange={(e) => updatePin(pin.id, { type: e.target.value as DamagePin["type"] })}
                  className="ncb-select"
                  style={{ flex: 1, fontSize: "0.8rem", padding: "0.35rem 0.5rem" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <select
                  value={pin.severity}
                  onChange={(e) => updatePin(pin.id, { severity: e.target.value as DamagePin["severity"] })}
                  className="ncb-select"
                  style={{ flex: 1, fontSize: "0.8rem", padding: "0.35rem 0.5rem" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              {/* Notes */}
              <textarea
                className="ncb-textarea"
                placeholder="Describe the damage…"
                value={pin.notes}
                onChange={(e) => updatePin(pin.id, { notes: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: "0.8rem", minHeight: 50, resize: "none" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
