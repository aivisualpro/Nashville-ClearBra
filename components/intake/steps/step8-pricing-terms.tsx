"use client";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

const ACKS = [
  { key: "ackDamage", title: "Pre-Existing Damage", desc: "I acknowledge that any existing damage or imperfections on the vehicle before installation are not the responsibility of Nashville ClearBra." },
  { key: "ackPaint", title: "Paint Peeling", desc: "I understand that removing film may result in paint lifting or damage and is not the responsibility of Nashville ClearBra." },
  { key: "ackTint", title: "Window Tint Responsibility", desc: "I understand that Nashville ClearBra is not responsible for window tint, including bubbling, cracking, or discoloration that may occur." },
  { key: "ackPersonal", title: "Personal Items / Vehicle Possession", desc: "I understand that I am responsible for removing all personal items and that Nashville ClearBra is not responsible for lost, stolen, or damaged items." },
  { key: "ackAuth", title: "Authorization to Perform Work", desc: "I authorize Nashville ClearBra to perform the services outlined in this work order." },
];

export function Step8PricingTerms({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update({ [k]: e.target.value });

  const ppf = parseFloat(v("ppfPrice")) || 0;
  const tintTotal = ((data.tintRows as Array<{price:string}>) || []).reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const ceramic = parseFloat(v("ceramicTotal")) || 0;
  const wpf = parseFloat(v("wpfPrice")) || 0;
  const addons = parseFloat(v("addonsTotal")) || 0;
  const deposit = parseFloat(v("deposit")) || 0;
  const total = ppf + tintTotal + ceramic + wpf + addons - deposit;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Price Summary */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon">💲</div>
            <div className="ncb-card-title">PRICE SUMMARY</div>
          </div>
          <div className="ncb-price-row"><span>PPF Price</span><span>${ppf.toFixed(2)}</span></div>
          <div className="ncb-price-row"><span>Tint Price</span><span>${tintTotal.toFixed(2)}</span></div>
          <div className="ncb-price-row"><span>Ceramic Price</span><span>${ceramic.toFixed(2)}</span></div>
          <div className="ncb-price-row"><span>WPF Price</span><span>${wpf.toFixed(2)}</span></div>
          <div className="ncb-price-row"><span>Total Add-Ons</span><span>${addons.toFixed(2)}</span></div>
          <div className="ncb-price-row"><span>Non-Refundable Deposit</span><span>-${deposit.toFixed(2)}</span></div>
          <div className="ncb-price-row ncb-price-row--total"><span>Total Price</span><span>${total.toFixed(2)}</span></div>
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>plus tax</div>

          <div className="ncb-field" style={{ marginTop: "1rem" }}>
            <label className="ncb-label">Non-Refundable Deposit</label>
            <input className="ncb-input" type="number" step="0.01" placeholder="$500.00" value={v("deposit")} onChange={set("deposit")} />
          </div>
        </div>

        {/* Acknowledgments */}
        <div className="ncb-card">
          <div className="ncb-card-header">
            <div className="ncb-card-icon">✅</div>
            <div className="ncb-card-title">REQUIRED ACKNOWLEDGMENTS</div>
          </div>
          {ACKS.map((a) => (
            <div key={a.key} className="ncb-ack-item">
              <div className="ncb-ack-text">
                <div className="ncb-ack-title">{a.title}</div>
                <div className="ncb-ack-desc">{a.desc}</div>
              </div>
              <div>
                <label className="ncb-label">Initials</label>
                <input className="ncb-initials-input" value={v(a.key)} onChange={set(a.key)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XPEL Referral */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">👥</div>
          <div className="ncb-card-title">XPEL REFERRAL PROGRAM (If Applicable)</div>
        </div>
        <div className="ncb-field" style={{ maxWidth: 400 }}>
          <label className="ncb-label">Were you referred by an XPEL Dealer or Installer?</label>
          <select className="ncb-select" value={v("xpelReferred")} onChange={set("xpelReferred")}>
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
      </div>
    </>
  );
}
