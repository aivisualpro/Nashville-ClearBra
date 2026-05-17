"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { IntakeData } from "../intake-wizard";
import type { DamagePin } from "./car-damage-marker-types";
// NOTE: @/lib/damage-diagram is lazy-imported inside the click handler
// below — it pulls in three.js + GLTFLoader (~600KB) which we don't want
// in the initial bundle or SSR pass.

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
  const diagramUrl = (data.damageDiagramUrl as string | undefined) || "";
  const diagramGeneratedAt = (data.damageDiagramGeneratedAt as string | undefined) || "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndUpload = async () => {
    setBusy(true);
    setError(null);
    try {
      const subtitle = [
        v("clientName"),
        [v("vYear"), v("vMake"), v("vModel")].filter(Boolean).join(" "),
        v("ro") ? `RO ${v("ro")}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      const { generateDamageDiagram } = await import("@/lib/damage-diagram");
      const blob = await generateDamageDiagram({
        pins,
        bodyStyle,
        subtitle,
      });

      const formData = new FormData();
      const fileName = `damage-${v("ro") || Date.now()}.png`;
      formData.append("file", new File([blob], fileName, { type: "image/png" }));

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = (await res.json()) as { success: boolean; url?: string; message?: string };
      if (!json.success || !json.url) {
        throw new Error(json.message || "Upload failed");
      }
      update({
        damageDiagramUrl: json.url,
        damageDiagramGeneratedAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate diagram");
    } finally {
      setBusy(false);
    }
  };

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
        <div className="ncb-card-title" style={{ marginBottom: "0.75rem" }}>DAMAGE DIAGRAM FOR PDF</div>
        <p style={{ fontSize: "0.8rem", color: "#475569", marginBottom: "0.75rem" }}>
          Generates a 5-view diagram (front, rear, top, left, right) with colored pins for each damage above.
          The resulting image URL is saved as <code style={{ background: "#eef2f7", padding: "1px 5px", borderRadius: 3, fontSize: "0.75rem" }}>{"{{damageDiagramUrl}}"}</code> in your Google Docs template.
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <button
            type="button"
            onClick={generateAndUpload}
            disabled={busy}
            className="ncb-button-primary"
            style={{ minWidth: 220 }}
          >
            {busy
              ? "Generating…"
              : diagramUrl
              ? "Regenerate Diagram"
              : "Generate Damage Diagram"}
          </button>
          {diagramUrl && !busy && (
            <a
              href={diagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                overflow: "hidden",
                width: 200,
                background: "#fff",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={diagramUrl}
                alt="Damage diagram"
                style={{ width: "100%", display: "block" }}
              />
            </a>
          )}
        </div>
        {diagramGeneratedAt && !busy && (
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            Last generated: {new Date(diagramGeneratedAt).toLocaleString()}
          </div>
        )}
        {error && (
          <div style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: "0.5rem" }}>
            {error}
          </div>
        )}
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
