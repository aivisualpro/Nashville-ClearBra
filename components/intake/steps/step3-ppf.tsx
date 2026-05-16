"use client";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

const FILM_TYPES = ["Ultimate Plus", "Ultimate Fusion", "Stealth", "Color PPF"];
const PACKAGES = [
  "Full Coverage","Full Front","Full Front + Rockers","Track Pack","Partial Front",
  "Wear and Tear","Hood Full","Hood Partial","All Doors","Single Door","Rockers",
  "Door Cups / Edges","Headlights","Fog Lights","Taillights","Mirror Caps",
  "A / B / C / D Pillars","Roof","Spoiler","Luggage Area","Interior Console",
  "Interior Trim","Custom / Other",
];

export function Step3PPF({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    update({ [k]: e.target.value });
  const ppfPackages = (data.ppfPackages as string[]) || [];
  const togglePkg = (p: string) => {
    const next = ppfPackages.includes(p) ? ppfPackages.filter((x) => x !== p) : [...ppfPackages, p];
    update({ ppfPackages: next });
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Film Type */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon" style={{ background: "#E77000" }}>1</div>
            <div className="ncb-card-title">FILM TYPE</div>
          </div>
          {FILM_TYPES.map((f) => (
            <label key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", cursor: "pointer", fontSize: "0.875rem" }}>
              <input type="radio" name="ppfFilm" checked={v("ppfFilm") === f} onChange={() => update({ ppfFilm: f })} style={{ accentColor: "#E77000" }} />
              {f}
            </label>
          ))}
          {v("ppfFilm") === "Color PPF" && (
            <div className="ncb-field" style={{ marginTop: "0.75rem" }}>
              <label className="ncb-label">Color / Supplier</label>
              <input className="ncb-input" placeholder="XPEL Kyalami Orange / XPEL" value={v("ppfColor")} onChange={set("ppfColor")} />
            </div>
          )}
        </div>

        {/* Install Level */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon" style={{ background: "#E77000" }}>2</div>
            <div className="ncb-card-title">INSTALL LEVEL</div>
          </div>
          <div className="ncb-toggle-group">
            <button className={`ncb-toggle-btn ${v("ppfLevel") !== "EXT" ? "ncb-toggle-btn--active" : ""}`} onClick={() => update({ ppfLevel: "STD" })}>STD</button>
            <button className={`ncb-toggle-btn ${v("ppfLevel") === "EXT" ? "ncb-toggle-btn--active" : ""}`} onClick={() => update({ ppfLevel: "EXT" })}>EXT</button>
          </div>
        </div>
      </div>

      {/* Package / Coverage */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon" style={{ background: "#E77000" }}>3</div>
          <div>
            <div className="ncb-card-title">PACKAGE / COVERAGE</div>
            <div className="ncb-card-subtitle">Select all that apply</div>
          </div>
        </div>
        <div className="ncb-check-grid">
          {PACKAGES.map((p) => (
            <div key={p} className={`ncb-check-item ${ppfPackages.includes(p) ? "ncb-check-item--selected" : ""}`} onClick={() => togglePkg(p)}>
              <input type="checkbox" checked={ppfPackages.includes(p)} readOnly style={{ accentColor: "#E77000" }} />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon" style={{ background: "#E77000" }}>4</div>
          <div className="ncb-card-title">INDIVIDUAL PANELS / NOTES</div>
        </div>
        <textarea className="ncb-textarea" placeholder="Add any details about specific panels or coverage..." value={v("ppfNotes")} onChange={set("ppfNotes")} maxLength={500} />
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>{(v("ppfNotes")).length} / 500</div>
      </div>

      {/* PPF Price */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon" style={{ background: "#E77000" }}>5</div>
          <div>
            <div className="ncb-card-title">PPF PRICE</div>
            <div className="ncb-card-subtitle">Enter the total price for Paint Protection Film</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontSize: "1.1rem", color: "#6b7280" }}>$</span>
          <input className="ncb-input" type="number" step="0.01" placeholder="3,250.00" value={v("ppfPrice")} onChange={set("ppfPrice")} style={{ maxWidth: 200 }} />
        </div>
      </div>
    </>
  );
}
