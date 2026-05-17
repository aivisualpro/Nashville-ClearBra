"use client";
import dynamic from "next/dynamic";
import { IntakeData } from "../intake-wizard";
import type { DamagePin } from "./car-damage-marker-types";

// SSR off — Three.js needs `window`
const CarDamageMarker = dynamic(
  () => import("@/components/intake/car-damage-marker"),
  { ssr: false, loading: () => <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>Loading 3D viewer…</div> }
);

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

export function Step9KnownDamage({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    update({ [k]: e.target.value });

  const pins = (data.damagePins as DamagePin[] | undefined) || [];
  const bodyStyle = ((data.bodyStyle as "sedan" | "suv" | undefined) ?? "sedan");

  return (
    <>
      <div className="ncb-info-banner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10" opacity="0.2"/><text x="10" y="14" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">i</text></svg>
        Click on the 3D car model to mark damage locations. Use the panel on the right to describe each mark.
      </div>

      <div className="ncb-card" style={{ marginTop: "1rem" }}>
        <div className="ncb-card-title" style={{ marginBottom: "0.75rem" }}>MARK KNOWN DAMAGE</div>
        <CarDamageMarker
          pins={pins}
          onChange={(newPins: DamagePin[]) => update({ damagePins: newPins })}
          bodyStyle={bodyStyle}
          onBodyStyleChange={(s) => update({ bodyStyle: s })}
        />
      </div>

      <div className="ncb-card">
        <div className="ncb-card-title" style={{ marginBottom: "0.75rem" }}>NOTES / PRE-EXISTING DAMAGE NOTES</div>
        <textarea className="ncb-textarea" placeholder="Add any details about the damage marked above..." value={v("damageNotes")} onChange={set("damageNotes")} maxLength={500} />
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>{v("damageNotes").length} / 500</div>
      </div>

      <div className="ncb-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="ncb-initials-input" style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, border: "2px solid #d1d5db", borderRadius: "0.5rem", color: "#1B2A4A" }}>
          {v("clientName")?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", color: "#374151" }}>I confirm that the above markings accurately represent the damage that was present before services.</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Initials</div>
        </div>
        <input className="ncb-initials-input" placeholder="Initials" value={v("damageInitials")} onChange={set("damageInitials")} />
      </div>
    </>
  );
}
