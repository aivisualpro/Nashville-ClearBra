"use client";
import { useState } from "react";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };
type TintRow = { series: string; shade: string; position: string; price: string };

const SERIES = ["CS", "XR Black", "XR Plus"];
const SHADES = ["5%", "15%", "20%", "35%", "50%", "55%", "70%"];
const POSITIONS = [
  "W - Windshield", "FS - Front Sides", "RS - Rear Sides", "R - Rear",
  "RS + R - Rear Sides + Rear", "SR - Sunroof", "SS - Side Sunroof", "Brow - Brow Strip",
];

export function Step4WindowTint({ data, update }: Props) {
  const filmSeries = (data.tintFilmSeries as string) || "";
  const [rows, setRows] = useState<TintRow[]>(
    (data.tintRows as TintRow[]) || [{ series: "XR Plus", shade: "70%", position: "", price: "" }]
  );

  const updateRows = (next: TintRow[]) => { setRows(next); update({ tintRows: next }); };
  const setRow = (i: number, field: keyof TintRow, val: string) => {
    const next = [...rows]; next[i] = { ...next[i], [field]: val }; updateRows(next);
  };
  const addRow = () => updateRows([...rows, { series: filmSeries || "XR Black", shade: "20%", position: "", price: "" }]);
  const removeRow = (i: number) => updateRows(rows.filter((_, idx) => idx !== i));

  const total = rows.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);

  return (
    <>
      {/* Film Series */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">🎬</div>
          <div>
            <div className="ncb-card-title">FILM SERIES</div>
            <div className="ncb-card-subtitle">Choose the film series you&apos;d like to use.</div>
          </div>
        </div>
        <div className="ncb-radio-cards">
          {SERIES.map((s) => (
            <div key={s} className={`ncb-radio-card ${filmSeries === s ? "ncb-radio-card--selected" : ""}`} onClick={() => update({ tintFilmSeries: s })}>
              <input type="radio" checked={filmSeries === s} readOnly style={{ accentColor: "#E8601C" }} />
              <div className="ncb-radio-card-label">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tint Selections */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">🚗</div>
          <div>
            <div className="ncb-card-title">TINT SELECTIONS</div>
            <div className="ncb-card-subtitle">Add one or more tint rows for this vehicle.</div>
          </div>
        </div>
        {/* Header labels */}
        <div className="ncb-tint-row" style={{ marginBottom: "0.25rem" }}>
          <span className="ncb-label">Film Series</span>
          <span className="ncb-label">Shade</span>
          <span className="ncb-label">Position</span>
          <span className="ncb-label">Price</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="ncb-tint-row">
            <select className="ncb-select" value={row.series} onChange={(e) => setRow(i, "series", e.target.value)}>
              {SERIES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="ncb-select" value={row.shade} onChange={(e) => setRow(i, "shade", e.target.value)}>
              {SHADES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="ncb-select" value={row.position} onChange={(e) => setRow(i, "position", e.target.value)}>
              <option value="">Select position...</option>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <input className="ncb-input" type="number" step="0.01" placeholder="$0.00" value={row.price} onChange={(e) => setRow(i, "price", e.target.value)} />
            <button className="ncb-tint-delete" onClick={() => removeRow(i)} title="Remove">🗑</button>
          </div>
        ))}
        <button onClick={addRow} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", border: "1px solid #1B2A4A", borderRadius: "0.5rem", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#1B2A4A" }}>
          + Add Tint Row
        </button>
        <div className="ncb-info-banner">
          Position key: FS = Front Sides, RS = Rear Sides, R = Rear, SR = Sunroof, SS = Side Sunroof, W = Windshield, Brow = brow strip.
        </div>
      </div>

      {/* Tint Price */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">💲</div>
          <div>
            <div className="ncb-card-title">TINT PRICE</div>
            <div className="ncb-card-subtitle">Total price for window tint.</div>
          </div>
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1B2A4A" }}>
          Total Tint Price: ${total.toFixed(2)}
        </div>
      </div>
    </>
  );
}
