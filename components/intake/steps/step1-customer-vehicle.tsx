"use client";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

export function Step1CustomerVehicle({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    update({ [k]: e.target.value });

  return (
    <>
      {/* Work Order Details */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">📋</div>
          <div className="ncb-card-title">WORK ORDER DETAILS</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--4">
          <div className="ncb-field">
            <label className="ncb-label">RO #</label>
            <input className="ncb-input" placeholder="RO-2024-0514-001" value={v("ro")} onChange={set("ro")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Drop-Off Date</label>
            <input className="ncb-input" type="date" value={v("dropOffDate")} onChange={set("dropOffDate")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Completion Date</label>
            <input className="ncb-input" type="date" value={v("completionDate")} onChange={set("completionDate")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">IG</label>
            <input className="ncb-input" placeholder="@nashvilleclearbra" value={v("ig")} onChange={set("ig")} />
          </div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--3" style={{ marginTop: "1rem" }}>
          <div className="ncb-field">
            <label className="ncb-label">TikTok</label>
            <input className="ncb-input" placeholder="@nashvilleclearbra" value={v("tiktok")} onChange={set("tiktok")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">How Heard of Us</label>
            <select className="ncb-select" value={v("howHeard")} onChange={set("howHeard")}>
              <option value="">Select...</option>
              <option>Google Search</option><option>Instagram</option><option>TikTok</option>
              <option>Referral</option><option>Repeat Customer</option><option>Other</option>
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">XPEL Referral Program</label>
            <select className="ncb-select" value={v("xpelReferral")} onChange={set("xpelReferral")}>
              <option value="No">No</option><option value="Yes">Yes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">👤</div>
          <div className="ncb-card-title">CLIENT INFORMATION</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--3">
          <div className="ncb-field">
            <label className="ncb-label">Full Name</label>
            <input className="ncb-input" placeholder="John Doe" value={v("clientName")} onChange={set("clientName")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Phone</label>
            <input className="ncb-input" placeholder="(615) 555-0198" value={v("clientPhone")} onChange={set("clientPhone")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Email</label>
            <input className="ncb-input" type="email" placeholder="john.doe@email.com" value={v("clientEmail")} onChange={set("clientEmail")} />
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon">🚗</div>
          <div className="ncb-card-title">VEHICLE INFORMATION</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--4">
          <div className="ncb-field">
            <label className="ncb-label">Year</label>
            <select className="ncb-select" value={v("vYear")} onChange={set("vYear")}>
              <option value="">Select</option>
              {Array.from({ length: 30 }, (_, i) => 2026 - i).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Make</label>
            <select className="ncb-select" value={v("vMake")} onChange={set("vMake")}>
              <option value="">Select</option>
              {["Tesla","BMW","Mercedes","Porsche","Audi","Ford","Chevrolet","Toyota","Honda","Rivian","Lexus","Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Model</label>
            <input className="ncb-input" placeholder="Model Y" value={v("vModel")} onChange={set("vModel")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Submodel</label>
            <input className="ncb-input" placeholder="Long Range AWD" value={v("vSubmodel")} onChange={set("vSubmodel")} />
          </div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--3" style={{ marginTop: "1rem" }}>
          <div className="ncb-field">
            <label className="ncb-label">Trim</label>
            <input className="ncb-input" placeholder="Performance" value={v("vTrim")} onChange={set("vTrim")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Color</label>
            <select className="ncb-select" value={v("vColor")} onChange={set("vColor")}>
              <option value="">Select</option>
              {["Pearl White Multi-Coat","Solid Black","Midnight Silver","Deep Blue","Red Multi-Coat","Ultra White","Other"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Plate</label>
            <input className="ncb-input" placeholder="ABC1234" value={v("vPlate")} onChange={set("vPlate")} />
          </div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--5" style={{ marginTop: "1rem" }}>
          <div className="ncb-field">
            <label className="ncb-label">VIN</label>
            <input className="ncb-input" placeholder="7SAYGDEE1RF123456" value={v("vin")} onChange={set("vin")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Mileage In</label>
            <input className="ncb-input" type="number" placeholder="8,750" value={v("mileage")} onChange={set("mileage")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Intake Staff</label>
            <select className="ncb-select" value={v("intakeStaff")} onChange={set("intakeStaff")}>
              <option value="">Select</option>
              <option>Mike S.</option><option>Chris T.</option><option>Jake R.</option>
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Installer</label>
            <select className="ncb-select" value={v("installer")} onChange={set("installer")}>
              <option value="">Select</option>
              <option>Chris T.</option><option>Jake R.</option><option>Mike S.</option>
            </select>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">IST</label>
            <select className="ncb-select" value={v("ist")} onChange={set("ist")}>
              <option value="">Select</option>
              <option>Jake R.</option><option>Mike S.</option><option>Chris T.</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
