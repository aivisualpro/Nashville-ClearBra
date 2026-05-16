"use client";

import { useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
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

// ─── Low-poly stylized car (all primitives, no GLB) ─────────────────
function CarBody() {
  const bodyColor = "#1B2A4A";
  const glassColor = "#88ccee";
  const wheelColor = "#222";
  const lightFront = "#ffffcc";
  const lightRear = "#ff4444";

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.7, 1.8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.15, 1.0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.6, 1.6]} />
        <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Windshield (front) */}
      <mesh position={[-0.85, 1.0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.05, 0.55, 1.5]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Rear window */}
      <mesh position={[1.15, 1.0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.05, 0.55, 1.5]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Side windows L */}
      <mesh position={[0.15, 1.0, 0.81]}>
        <boxGeometry args={[2.0, 0.45, 0.02]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.4} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Side windows R */}
      <mesh position={[0.15, 1.0, -0.81]}>
        <boxGeometry args={[2.0, 0.45, 0.02]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.4} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Hood */}
      <mesh position={[-1.5, 0.82, 0]} castShadow>
        <boxGeometry args={[1.2, 0.05, 1.75]} />
        <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Trunk */}
      <mesh position={[1.6, 0.82, 0]} castShadow>
        <boxGeometry args={[0.9, 0.05, 1.75]} />
        <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Front bumper */}
      <mesh position={[-2.15, 0.35, 0]}>
        <boxGeometry args={[0.15, 0.5, 1.9]} />
        <meshStandardMaterial color="#111" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Rear bumper */}
      <mesh position={[2.15, 0.35, 0]}>
        <boxGeometry args={[0.15, 0.5, 1.9]} />
        <meshStandardMaterial color="#111" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Headlights */}
      {[0.6, -0.6].map((z) => (
        <mesh key={`hl-${z}`} position={[-2.13, 0.5, z]}>
          <boxGeometry args={[0.08, 0.2, 0.4]} />
          <meshStandardMaterial color={lightFront} emissive={lightFront} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Taillights */}
      {[0.6, -0.6].map((z) => (
        <mesh key={`tl-${z}`} position={[2.13, 0.5, z]}>
          <boxGeometry args={[0.08, 0.2, 0.4]} />
          <meshStandardMaterial color={lightRear} emissive={lightRear} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Wheels */}
      {[
        [-1.3, 0.15, 1.0], [-1.3, 0.15, -1.0],
        [1.3, 0.15, 1.0], [1.3, 0.15, -1.0],
      ].map(([x, y, z], i) => (
        <mesh key={`w-${i}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color={wheelColor} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Side mirrors */}
      {[0.95, -0.95].map((z) => (
        <mesh key={`m-${z}`} position={[-0.6, 0.9, z]}>
          <boxGeometry args={[0.15, 0.1, 0.12]} />
          <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} />
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
        target={[0, 0.5, 0]}
      />
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.9} />
      </mesh>
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
          background: "#0f0f1a",
          position: "relative",
        }}
      >
        <Canvas
          shadows
          camera={{ position: [4, 3, 4], fov: 45 }}
          style={{ width: "100%", height: "100%", minHeight: 400 }}
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
            background: "rgba(0,0,0,0.6)",
            color: "#aaa",
            fontSize: "0.7rem",
            padding: "4px 10px",
            borderRadius: 6,
            pointerEvents: "none",
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
