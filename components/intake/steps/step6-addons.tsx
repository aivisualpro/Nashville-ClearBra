"use client";
import { IntakeData } from "../intake-wizard";
import { Lightbulb, Smartphone, Wrench, MessageSquare, DollarSign } from "lucide-react";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

export function Step6AddOns({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    update({ [k]: e.target.value });

  return (
    <>
      {/* Tinted Lights */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><Lightbulb className="size-4" /></div>
          <div className="ncb-card-title">TINTED LIGHTS</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--2">
          <div className="ncb-field">
            <label className="ncb-label">Front Shade</label>
            <div className="ncb-radio-cards">
              {["50%","35%","25%"].map((s) => (
                <div key={s} className={`ncb-radio-card ${v("lightFront")===s?"ncb-radio-card--selected":""}`} onClick={()=>update({lightFront:s})}>
                  <input type="radio" checked={v("lightFront")===s} readOnly style={{accentColor:"#E77000"}} /> {s}
                </div>
              ))}
            </div>
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Rear Shade</label>
            <div className="ncb-radio-cards">
              {["50%","35%","25%"].map((s) => (
                <div key={s} className={`ncb-radio-card ${v("lightRear")===s?"ncb-radio-card--selected":""}`} onClick={()=>update({lightRear:s})}>
                  <input type="radio" checked={v("lightRear")===s} readOnly style={{accentColor:"#E77000"}} /> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--2" style={{marginTop:"1rem"}}>
          <div className="ncb-field">
            <label className="ncb-label">Film</label>
            <input className="ncb-input" placeholder="e.g., XPEL Light Smoke" value={v("lightFilm")} onChange={set("lightFilm")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Price</label>
            <input className="ncb-input" type="number" step="0.01" placeholder="$0.00" value={v("lightPrice")} onChange={set("lightPrice")} />
          </div>
        </div>
      </div>

      {/* Screen Protector */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><Smartphone className="size-4" /></div>
          <div className="ncb-card-title">SCREEN PROTECTOR</div>
        </div>
        <div style={{display:"flex",gap:"1rem",alignItems:"end",flexWrap:"wrap"}}>
          <div className="ncb-radio-cards" style={{flex:1}}>
            {["Satin","Gloss"].map((s) => (
              <div key={s} className={`ncb-radio-card ${v("screenType")===s?"ncb-radio-card--selected":""}`} onClick={()=>update({screenType:s})}>
                <input type="radio" checked={v("screenType")===s} readOnly style={{accentColor:"#E77000"}} /> {s}
              </div>
            ))}
          </div>
          <div className="ncb-field" style={{minWidth:120}}>
            <label className="ncb-label">Price</label>
            <input className="ncb-input" type="number" step="0.01" placeholder="$0.00" value={v("screenPrice")} onChange={set("screenPrice")} />
          </div>
        </div>
      </div>

      {/* Remove PPF */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><Wrench className="size-4" /></div>
          <div className="ncb-card-title">REMOVE PPF</div>
        </div>
        <div style={{display:"flex",gap:"1rem",alignItems:"end",flexWrap:"wrap"}}>
          <label className="ncb-check-item" style={{cursor:"pointer"}}>
            <input type="checkbox" checked={data.removePpf===true} onChange={()=>update({removePpf:!data.removePpf})} style={{accentColor:"#E77000"}} />
            Yes, remove existing PPF
          </label>
          <div className="ncb-field" style={{flex:1}}>
            <label className="ncb-label">Panels</label>
            <input className="ncb-input" placeholder="e.g., Hood, Fenders, Bumpers" value={v("removePanels")} onChange={set("removePanels")} />
          </div>
          <div className="ncb-field" style={{minWidth:120}}>
            <label className="ncb-label">Price</label>
            <input className="ncb-input" type="number" step="0.01" placeholder="$0.00" value={v("removePrice")} onChange={set("removePrice")} />
          </div>
        </div>
      </div>

      {/* Additional Requests */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><MessageSquare className="size-4" /></div>
          <div className="ncb-card-title">ADDITIONAL REQUESTS / SPECIAL INSTRUCTIONS</div>
        </div>
        <textarea className="ncb-textarea" placeholder="Add any special requests or additional instructions..." value={v("addRequests")} onChange={set("addRequests")} maxLength={200} />
        <div style={{textAlign:"right",fontSize:"0.75rem",color:"#9ca3af"}}>{v("addRequests").length} / 200</div>
      </div>

      {/* Total */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><DollarSign className="size-4" /></div>
          <div>
            <div className="ncb-card-title">TOTAL ADD-ONS</div>
            <div className="ncb-card-subtitle">Total price for all add-ons selected</div>
          </div>
        </div>
        <div className="ncb-field" style={{maxWidth:160}}>
          <label className="ncb-label">Total</label>
          <input className="ncb-input" type="number" step="0.01" placeholder="$0.00" value={v("addonsTotal")} onChange={set("addonsTotal")} />
        </div>
      </div>
    </>
  );
}
