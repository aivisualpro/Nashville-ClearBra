"use client";
import { IntakeData } from "../intake-wizard";
import { Shield, Car, DollarSign } from "lucide-react";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

const CERAMIC_OPTIONS = [
  { label: "Fusion Lite", price: "$399.00" },
  { label: "Fusion Classic", price: "$599.00" },
  { label: "Fusion Premium V2", price: "$899.00" },
  { label: "Fusion Satin", price: "$999.00" },
];
const SURFACES = ["Paint / PPF","Glass","Trim / Plastic","Rim Faces","Rims Off","Interior","Seats","Engine Bay"];

export function Step5CeramicWPF({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: e.target.value });
  const wpfEnabled = data.wpfEnabled === true;
  const ceramicType = v("ceramicType");
  const ceramicSurfaces = (data.ceramicSurfaces as string[]) || [];
  const toggleSurface = (s: string) => {
    const next = ceramicSurfaces.includes(s) ? ceramicSurfaces.filter((x) => x !== s) : [...ceramicSurfaces, s];
    update({ ceramicSurfaces: next });
  };

  return (
    <>
      {/* WPF */}
      <div className="ncb-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="ncb-card-header" style={{ marginBottom: 0 }}>
            <div className="ncb-card-icon"><Shield className="size-4" /></div>
            <div>
              <div className="ncb-card-title">WINDSHIELD PROTECTION FILM (WPF)</div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "0.25rem" }}>
                <div onClick={() => update({ wpfEnabled: !wpfEnabled })} style={{ width: 44, height: 24, borderRadius: 12, background: wpfEnabled ? "#1B2A4A" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: wpfEnabled ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Add WPF to this vehicle</span>
              </label>
            </div>
          </div>
          {wpfEnabled && (
            <div className="ncb-field" style={{ minWidth: 150 }}>
              <label className="ncb-label">WPF Price</label>
              <input className="ncb-input" type="number" step="0.01" placeholder="$750.00" value={v("wpfPrice")} onChange={set("wpfPrice")} />
            </div>
          )}
        </div>
      </div>

      {/* Ceramic Coating */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><Shield className="size-4" /></div>
          <div className="ncb-card-title">CERAMIC COATING</div>
        </div>
        <div className="ncb-radio-cards">
          {CERAMIC_OPTIONS.map((o) => (
            <div key={o.label} className={`ncb-radio-card ${ceramicType === o.label ? "ncb-radio-card--selected" : ""}`} onClick={() => update({ ceramicType: o.label })}>
              <input type="radio" checked={ceramicType === o.label} readOnly style={{ accentColor: "#E77000" }} />
              <div className="ncb-radio-card-label">{o.label}</div>
              <div className="ncb-radio-card-price">{o.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ceramic Surfaces */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><Car className="size-4" /></div>
          <div className="ncb-card-title">CERAMIC SURFACES</div>
        </div>
        <div className="ncb-check-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {SURFACES.map((s) => (
            <div key={s} className={`ncb-check-item ${ceramicSurfaces.includes(s) ? "ncb-check-item--selected" : ""}`} onClick={() => toggleSurface(s)}>
              <input type="checkbox" checked={ceramicSurfaces.includes(s)} readOnly style={{ accentColor: "#E77000" }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Ceramic Price */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><DollarSign className="size-4" /></div>
          <div className="ncb-card-title">CERAMIC PRICE</div>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
          <div><span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Ceramic Coating</span><div style={{ fontWeight: 700 }}>${v("ceramicType") ? CERAMIC_OPTIONS.find((o) => o.label === ceramicType)?.price.replace("$","") || "0.00" : "0.00"}</div></div>
          <div><span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Additional Surfaces</span><div style={{ fontWeight: 700 }}>${v("ceramicSurfacePrice") || "0.00"}</div></div>
          <div className="ncb-field">
            <label className="ncb-label">Ceramic Total</label>
            <input className="ncb-input" type="number" step="0.01" placeholder="$1,099.00" value={v("ceramicTotal")} onChange={set("ceramicTotal")} style={{ maxWidth: 160 }} />
          </div>
        </div>
      </div>

      <div className="ncb-info-banner">
        The main coating package applies to paint or PPF. Other surfaces use their own XPEL-specific products.
      </div>
    </>
  );
}
