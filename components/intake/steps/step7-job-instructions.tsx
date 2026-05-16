"use client";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

type JobItem = {
  key: string;
  label: string;
  positions?: string[];
  options?: string[];
  sublabel?: string;
  checkbox?: boolean;
  hasColor?: boolean;
};

const JOBS_LEFT: JobItem[] = [
  { key: "removeEmblems", label: "Remove Emblems", positions: ["F","S","R"] },
  { key: "installEmblems", label: "Install Emblems Back On", positions: ["F","S","R"] },
  { key: "removeHandles", label: "Remove Handles", options: ["Yes","No"], sublabel: "$500 upcharge if selected" },
  { key: "removeHeadlights", label: "Remove Headlights / Taillights", checkbox: true },
  { key: "removeBumper", label: "Remove Bumper", positions: ["F","R"] },
  { key: "wrapBumperFenders", label: "Wrap Between Bumper and Fenders", checkbox: true },
];
const JOBS_RIGHT: JobItem[] = [
  { key: "paintEmblems", label: "Paint Emblems", positions: ["F","S","R"], hasColor: true },
  { key: "smallLetters", label: "Small Letter Emblems NOT Reinstalled", checkbox: true },
  { key: "removeTrim", label: "Remove Trim Pieces", checkbox: true },
  { key: "removeSideMarkers", label: "Remove Side Marker Signals", options: ["Yes","No"] },
  { key: "removeAntenna", label: "Remove Roof / Trunk Antenna", checkbox: true },
  { key: "dentRepair", label: "Dent Repair", checkbox: true },
];

export function Step7JobInstructions({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update({ [k]: e.target.value });
  const checked = (k: string) => data[k] === true;
  const toggle = (k: string) => update({ [k]: !data[k] });
  const posArr = (k: string) => (data[k] as string[]) || [];
  const togglePos = (k: string, p: string) => {
    const arr = posArr(k);
    update({ [k]: arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p] });
  };

  const renderItem = (item: JobItem) => (
    <div key={item.key} className="ncb-job-item">
      <div className="ncb-job-item-left">
        <div className="ncb-job-icon">🔧</div>
        <div>
          <div className="ncb-job-label">{item.label}</div>
          {item.sublabel && <div className="ncb-job-sublabel">{item.sublabel}</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {item.positions?.map((p) => (
          <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", cursor: "pointer" }}>
            <input type="checkbox" checked={posArr(item.key).includes(p)} onChange={() => togglePos(item.key, p)} style={{ accentColor: "#E77000" }} />
            {p}
          </label>
        ))}
        {item.options?.map((o) => (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", cursor: "pointer" }}>
            <input type="radio" name={item.key} checked={v(item.key) === o} onChange={() => update({ [item.key]: o })} style={{ accentColor: "#E77000" }} />
            {o}
          </label>
        ))}
        {item.checkbox && (
          <input type="checkbox" checked={checked(item.key)} onChange={() => toggle(item.key)} style={{ accentColor: "#E77000", width: 18, height: 18 }} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="ncb-card">
        <div className="ncb-job-grid">
          <div>
            {JOBS_LEFT.map(renderItem)}
          </div>
          <div>
            {JOBS_RIGHT.map((item) => (
              <div key={item.key}>
                {renderItem(item)}
                {item.hasColor && (
                  <div style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", alignItems: "center" }}>
                    <label className="ncb-label" style={{ margin: 0 }}>Color</label>
                    <select className="ncb-select" value={v("emblemColor")} onChange={set("emblemColor")} style={{ maxWidth: 160 }}>
                      <option value="">Select color</option>
                      <option>Gloss Black</option><option>Matte Black</option><option>Chrome</option><option>Custom</option>
                    </select>
                    <label className="ncb-label" style={{ margin: 0 }}>Finish</label>
                    <div className="ncb-toggle-group">
                      <button className={`ncb-toggle-btn ${v("emblemFinish")==="Satin"?"ncb-toggle-btn--active":""}`} onClick={()=>update({emblemFinish:"Satin"})}>Satin</button>
                      <button className={`ncb-toggle-btn ${v("emblemFinish")==="Gloss"?"ncb-toggle-btn--active":""}`} onClick={()=>update({emblemFinish:"Gloss"})}>Gloss</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liability Notice */}
      <div className="ncb-liability">
        <div className="ncb-liability-icon">!</div>
        <div className="ncb-liability-text">
          <strong>LIABILITY NOTICE</strong><br />
          Removal of vehicle parts can involve risk of damage to clips, panels, paint, and components.
          Nashville ClearBra is not responsible for any damage that may occur during the removal or reinstallation process.
        </div>
        <div className="ncb-field">
          <label className="ncb-label">Initial Here</label>
          <input className="ncb-initials-input" placeholder="Initials" value={v("liabilityInitials")} onChange={set("liabilityInitials")} />
        </div>
      </div>
    </>
  );
}
