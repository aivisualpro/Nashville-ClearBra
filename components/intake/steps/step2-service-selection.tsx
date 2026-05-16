"use client";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

const SERVICES = [
  { key: "ppf", label: "Paint Protection Film (PPF)", icon: "🛡️" },
  { key: "tint", label: "Window Tint", icon: "🪟" },
  { key: "wpf", label: "Windshield Protection Film (WPF)", icon: "🛡️" },
  { key: "ceramic", label: "Ceramic Coating", icon: "✨" },
  { key: "addons", label: "Add-Ons", icon: "➕" },
];

export function Step2ServiceSelection({ data, update }: Props) {
  const selected = (data.services as string[]) || [];
  const toggle = (key: string) => {
    const next = selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key];
    update({ services: next });
  };
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    update({ [k]: e.target.value });

  return (
    <>
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">📋</div>
          <div>
            <div className="ncb-card-title">SELECT SERVICES</div>
            <div className="ncb-card-subtitle">Select all services that apply to this vehicle.</div>
          </div>
        </div>
        <div className="ncb-service-cards">
          {SERVICES.map((s) => (
            <div
              key={s.key}
              className={`ncb-service-card ${selected.includes(s.key) ? "ncb-service-card--selected" : ""}`}
              onClick={() => toggle(s.key)}
            >
              <div className="ncb-service-icon">{s.icon}</div>
              <div className="ncb-service-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">👥</div>
          <div className="ncb-card-title">REFERRAL</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--3">
          <div className="ncb-field">
            <label className="ncb-label">XPEL Referral Program</label>
            <select className="ncb-select" value={v("refXpel")} onChange={set("refXpel")}>
              <option value="No">No</option><option value="Yes">Yes</option>
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Referral Source</label>
            <select className="ncb-select" value={v("refSource")} onChange={set("refSource")}>
              <option value="">Select...</option>
              <option>Google</option><option>Instagram</option><option>TikTok</option>
              <option>Friend/Family</option><option>Dealer</option><option>Other</option>
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Referral Details (if Other)</label>
            <input className="ncb-input" placeholder="Enter details..." value={v("refDetails")} onChange={set("refDetails")} />
          </div>
        </div>
      </div>

      <div className="ncb-info-banner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10" opacity="0.2"/><text x="10" y="14" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">i</text></svg>
        Only the services you select will appear in the next steps.
      </div>
    </>
  );
}
