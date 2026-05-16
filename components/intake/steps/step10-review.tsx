"use client";
import { useRef, useState } from "react";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

export function Step10Review({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: e.target.value });
  const sigRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [authConfirm, setAuthConfirm] = useState(false);

  const ppf = parseFloat(v("ppfPrice")) || 0;
  const tintTotal = ((data.tintRows as Array<{price:string}>) || []).reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const ceramic = parseFloat(v("ceramicTotal")) || 0;
  const wpf = parseFloat(v("wpfPrice")) || 0;
  const addons = parseFloat(v("addonsTotal")) || 0;
  const deposit = parseFloat(v("deposit")) || 0;
  const total = ppf + tintTotal + ceramic + wpf + addons - deposit;
  const services = (data.services as string[]) || [];

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = sigRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };
  const startSig = (e: React.MouseEvent | React.TouchEvent) => {
    setIsSigning(true);
    const ctx = sigRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const drawSig = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSigning) return;
    const ctx = sigRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2; ctx.strokeStyle = "#1B2A4A"; ctx.lineCap = "round";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopSig = () => setIsSigning(false);
  const clearSig = () => {
    const c = sigRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  return (
    <>
      <div className="ncb-summary-grid">
        {/* Customer + Vehicle */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon">👤</div>
            <div className="ncb-card-title">CUSTOMER + VEHICLE SUMMARY</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
            <div>
              <strong>{v("clientName") || "—"}</strong><br/>
              {v("clientPhone")}<br/>{v("clientEmail")}
            </div>
            <div>
              <strong>{v("vYear")} {v("vMake")} {v("vModel")}</strong><br/>
              {v("vSubmodel")}<br/>{v("vColor")}
            </div>
            <div>
              <span style={{color:"#6b7280"}}>VIN</span><br/>{v("vin") || "—"}<br/>
              <span style={{color:"#6b7280"}}>Plate</span><br/>{v("vPlate") || "—"}
            </div>
          </div>
        </div>

        {/* Selected Services */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon">📋</div>
            <div className="ncb-card-title">SELECTED SERVICES SUMMARY</div>
          </div>
          <ul style={{ fontSize: "0.85rem", paddingLeft: "1.25rem", margin: 0 }}>
            {services.includes("ppf") && <li>PPF — {v("ppfFilm") || "N/A"}</li>}
            {services.includes("tint") && <li>Window Tint</li>}
            {services.includes("ceramic") && <li>Ceramic Coating — {v("ceramicType") || "N/A"}</li>}
            {services.includes("wpf") && <li>Windshield Protection Film</li>}
            {services.includes("addons") && <li>Add-Ons</li>}
            {services.length === 0 && <li style={{color:"#9ca3af"}}>No services selected</li>}
          </ul>
        </div>

        {/* Job Instructions */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon">📝</div>
            <div className="ncb-card-title">JOB INSTRUCTIONS SUMMARY</div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#374151" }}>{v("addRequests") || "No special instructions."}</p>
        </div>

        {/* Total Price */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon" style={{ background: "#16a34a" }}>💲</div>
            <div className="ncb-card-title">TOTAL PRICE</div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Estimated Total</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1B2A4A" }}>${total.toFixed(2)}</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Plus tax</div>
          {deposit > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <span style={{ color: "#6b7280" }}>Deposit (50%)</span>
              <span style={{ float: "right", fontWeight: 700 }}>${deposit.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <div className="ncb-card-title" style={{ marginBottom: "0.5rem" }}>DROP-OFF SIGNATURE</div>
          <canvas
            ref={sigRef}
            width={500} height={150}
            className="ncb-signature-pad"
            style={{ width: "100%", height: 150 }}
            onMouseDown={startSig} onMouseMove={drawSig} onMouseUp={stopSig} onMouseLeave={stopSig}
            onTouchStart={startSig} onTouchMove={drawSig} onTouchEnd={stopSig}
          />
          <button onClick={clearSig} style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Clear signature
          </button>
          <div className="ncb-form-grid ncb-form-grid--2" style={{ marginTop: "0.75rem" }}>
            <div className="ncb-field">
              <label className="ncb-label">Print Name</label>
              <input className="ncb-input" value={v("sigName")} onChange={set("sigName")} placeholder={v("clientName")} />
            </div>
            <div className="ncb-field">
              <label className="ncb-label">Date</label>
              <input className="ncb-input" type="date" value={v("sigDate")} onChange={set("sigDate")} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.8rem", cursor: "pointer" }}>
            <input type="checkbox" checked={authConfirm} onChange={() => setAuthConfirm(!authConfirm)} style={{ accentColor: "#E8601C" }} />
            I authorize the services listed above and confirm that all information is correct.
          </label>
        </div>

        <div>
          <div className="ncb-card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <div className="ncb-label">RO Number</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{v("ro") || "—"}</div>
              </div>
              <div>
                <div className="ncb-label">Drop Off Date</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{v("dropOffDate") || "—"}</div>
              </div>
            </div>
          </div>
          <div className="ncb-card">
            <div className="ncb-card-header">
              <div className="ncb-card-icon">📋</div>
              <div className="ncb-card-title">WORK ORDER SUMMARY</div>
            </div>
            <div className="ncb-price-row"><span>Services</span><span>{services.length} items</span></div>
            {deposit > 0 && <div className="ncb-price-row"><span>Deposit (50%)</span><span>${deposit.toFixed(2)}</span></div>}
            <div className="ncb-price-row ncb-price-row--total"><span>Estimated Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="ncb-success-banner">
        ✅ PDF Work Order will be generated after submission.
      </div>
    </>
  );
}
