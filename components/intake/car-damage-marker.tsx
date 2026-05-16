"use client";

import { useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges, ContactShadows } from "@react-three/drei";
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

// ─── Blueprint-style wireframe car (translucent panels + edge lines) ─
// Each panel is a translucent light-blue volume with crisp edge lines drawn
// via drei's <Edges>. Glowing cyan headlights and a subtle ground shadow
// finish the "blueprint / x-ray" look from the reference image.
const PANEL_FILL = "#bfe1f5";   // very light cyan-blue translucent fill
const EDGE_COLOR = "#1e5b8e";   // deep blue edge lines
const GLASS_FILL = "#9ed8f5";
const WHEEL_RIM = "#9ca3af";
const TIRE_DARK = "#1f2937";
const HEAD_GLOW = "#22d3ee";    // cyan headlight glow
const REAR_GLOW = "#ef4444";

function Panel({
  position,
  rotation,
  size,
  color = PANEL_FILL,
  opacity = 0.15,
  edgeColor = EDGE_COLOR,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color?: string;
  opacity?: number;
  edgeColor?: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={opacity}
        transmission={0.4}
        roughness={0.15}
        metalness={0.0}
        clearcoat={0.4}
        depthWrite={false}
      />
      <Edges threshold={15} color={edgeColor} />
    </mesh>
  );
}

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {/* Tire */}
      <mesh>
        <cylinderGeometry args={[0.34, 0.34, 0.22, 28]} />
        <meshPhysicalMaterial
          color={TIRE_DARK}
          transparent
          opacity={0.18}
          roughness={0.6}
          depthWrite={false}
        />
        <Edges threshold={15} color={EDGE_COLOR} />
      </mesh>
      {/* Rim */}
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, 0.24, 16]} />
        <meshStandardMaterial color={WHEEL_RIM} metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

function CarBody() {
  return (
    <group>
      {/* ── Lower chassis ── */}
      <Panel position={[0, 0.45, 0]} size={[4.2, 0.55, 1.7]} />

      {/* ── Hood (front, slightly raised) ── */}
      <Panel position={[-1.4, 0.78, 0]} size={[1.4, 0.12, 1.65]} />

      {/* ── Trunk (rear) ── */}
      <Panel position={[1.55, 0.78, 0]} size={[1.0, 0.12, 1.65]} />

      {/* ── Cabin / roof ── */}
      <Panel position={[0.1, 1.18, 0]} size={[2.0, 0.55, 1.55]} />

      {/* ── Windshield (front, angled) ── */}
      <Panel
        position={[-0.85, 1.05, 0]}
        rotation={[0, 0, 0.42]}
        size={[0.06, 0.55, 1.5]}
        color={GLASS_FILL}
        opacity={0.22}
      />

      {/* ── Rear window (angled) ── */}
      <Panel
        position={[1.05, 1.05, 0]}
        rotation={[0, 0, -0.42]}
        size={[0.06, 0.55, 1.5]}
        color={GLASS_FILL}
        opacity={0.22}
      />

      {/* ── Side windows ── */}
      <Panel
        position={[0.1, 1.22, 0.78]}
        size={[1.85, 0.4, 0.03]}
        color={GLASS_FILL}
        opacity={0.22}
      />
      <Panel
        position={[0.1, 1.22, -0.78]}
        size={[1.85, 0.4, 0.03]}
        color={GLASS_FILL}
        opacity={0.22}
      />

      {/* ── Front bumper ── */}
      <Panel position={[-2.08, 0.4, 0]} size={[0.18, 0.4, 1.8]} />

      {/* ── Rear bumper ── */}
      <Panel position={[2.08, 0.4, 0]} size={[0.18, 0.4, 1.8]} />

      {/* ── Side mirrors ── */}
      <Panel position={[-0.45, 0.95, 0.92]} size={[0.16, 0.12, 0.14]} />
      <Panel position={[-0.45, 0.95, -0.92]} size={[0.16, 0.12, 0.14]} />

      {/* ── Door split lines ── */}
      <mesh position={[0.15, 0.45, 0.86]}>
        <boxGeometry args={[0.015, 0.55, 0.015]} />
        <meshBasicMaterial color={EDGE_COLOR} />
      </mesh>
      <mesh position={[0.15, 0.45, -0.86]}>
        <boxGeometry args={[0.015, 0.55, 0.015]} />
        <meshBasicMaterial color={EDGE_COLOR} />
      </mesh>

      {/* ── Headlights (glowing cyan, like reference) ── */}
      {[0.55, -0.55].map((z) => (
        <group key={`hl-${z}`} position={[-2.14, 0.55, z]}>
          <mesh>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial
              color={HEAD_GLOW}
              emissive={HEAD_GLOW}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          {/* outer halo */}
          <mesh>
            <sphereGeometry args={[0.17, 24, 24]} />
            <meshBasicMaterial
              color={HEAD_GLOW}
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* ── Taillights ── */}
      {[0.55, -0.55].map((z) => (
        <mesh key={`tl-${z}`} position={[2.14, 0.55, z]}>
          <boxGeometry args={[0.08, 0.18, 0.32]} />
          <meshStandardMaterial
            color={REAR_GLOW}
            emissive={REAR_GLOW}
            emissiveIntensity={0.7}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── Wheels ── */}
      <Wheel position={[-1.25, 0.34, 0.92]} />
      <Wheel position={[-1.25, 0.34, -0.92]} />
      <Wheel position={[1.25, 0.34, 0.92]} />
      <Wheel position={[1.25, 0.34, -0.92]} />
    </group>
  );
}

// ─── Pin marker in 3D space ─────────────────────────────────────────
function PinMarker({
  pin,
  isSelected,
  onClick,
}: {
  pin: DamagePin;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = SEVERITY_COLORS[pin.severity] || "#facc15";

  useFrame(({ clock }) => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.15);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={pin.position}>
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.6 : 0.3} />
      </mesh>
      {/* Pin stem */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Number label */}
      <Html position={[0, 0.18, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          background: color,
          color: "#fff",
          width: 20, height: 20,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}>
          {pin.id.replace("pin-", "")}
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
}: {
  pins: DamagePin[];
  selectedPin: string | null;
  onAddPin: (pos: [number, number, number], normal: [number, number, number]) => void;
  onSelectPin: (id: string) => void;
}) {
  const { camera } = useThree();

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
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
        <CarBody />
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
        minDistance={3}
        maxDistance={10}
        target={[0, 0.6, 0]}
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
}

export default function CarDamageMarker({ pins, onChange }: CarDamageMarkerProps) {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

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
          camera={{ position: [-5.5, 3.5, 4.5], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", minHeight: 400, background: "transparent" }}
        >
          <Scene
            pins={pins}
            selectedPin={selectedPin}
            onAddPin={addPin}
            onSelectPin={setSelectedPin}
          />
        </Canvas>
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
