"use client";
import * as React from "react";
import { IntakeData } from "../intake-wizard";
import { OptionSelect } from "@/components/ui/option-select";
import { ClipboardList, User, Car } from "lucide-react";

const VEHICLE_YEARS = ["2027","2026","2025","2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011","2010","2009","2008","2007","2006","2005","2004","2003","2002","2001","2000","1999","1998","1997","1996","1995","1994","1993","1992","1991","1990","1989","1988","1987","1986","1985","1984","1983","1982","1981","1980","1979","1978","1977","1976","1975","1974","1973","1972","1971","1970"];

function YearCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = React.useMemo(() => {
    if (!search) return VEHICLE_YEARS;
    return VEHICLE_YEARS.filter((y) => y.includes(search));
  }, [search]);

  return (
    <div className="relative" ref={ref}>
      <input
        className="ncb-input w-full"
        value={value}
        placeholder="2026"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setSearch(e.target.value); }}
      />
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-popover border rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-y-auto max-h-[200px]">
            {filtered.map((y) => (
              <button
                key={y}
                type="button"
                className={`block w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  y === value ? "bg-accent font-medium" : "hover:bg-muted"
                }`}
                onClick={() => { onChange(y); setOpen(false); setSearch(""); }}
              >
                {y}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">No match</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
          <div className="ncb-card-icon"><ClipboardList className="size-4" /></div>
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
            <OptionSelect
              optionSetName="Lead Source"
              value={v("howHeardId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ howHeardId: opt._id, howHeard: opt.value });
                } else {
                  update({ howHeardId: "", howHeard: "" });
                }
              }}
              placeholder="Select lead source…"
            />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">XPEL Referral Program</label>
            <OptionSelect
              optionSetName="YesNo"
              value={v("xpelReferralId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ xpelReferralId: opt._id, xpelReferral: opt.value });
                } else {
                  update({ xpelReferralId: "", xpelReferral: "" });
                }
              }}
              placeholder="Select…"
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="ncb-card">
        <div className="ncb-card-header">
          <div className="ncb-card-icon"><User className="size-4" /></div>
          <div className="ncb-card-title">CLIENT INFORMATION</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--3">
          <div className="ncb-field">
            <label className="ncb-label">Full Name</label>
            <input className="ncb-input" placeholder="John Doe" value={v("clientName")} onChange={set("clientName")} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Phone</label>
            <input
              className="ncb-input"
              placeholder="(615) 555-0198"
              value={v("clientPhone")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                let formatted = "";
                if (digits.length > 0) formatted = `(${digits.slice(0, 3)}`;
                if (digits.length >= 4) formatted += `) ${digits.slice(3, 6)}`;
                if (digits.length >= 7) formatted += `-${digits.slice(6)}`;
                update({ clientPhone: formatted });
              }}
            />
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
          <div className="ncb-card-icon"><Car className="size-4" /></div>
          <div className="ncb-card-title">VEHICLE INFORMATION</div>
        </div>
        <div className="ncb-form-grid ncb-form-grid--4">
          <div className="ncb-field">
            <label className="ncb-label">Year</label>
            <YearCombobox value={v("vYear") || "2026"} onChange={(val) => update({ vYear: val })} />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Make</label>
            <OptionSelect
              optionSetName="Vehicle Make"
              value={v("vMakeId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ vMakeId: opt._id, vMake: opt.value });
                } else {
                  update({ vMakeId: "", vMake: "" });
                }
              }}
              placeholder="Select make…"
            />
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
            <OptionSelect
              optionSetName="Vehicle Color"
              value={v("vColorId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ vColorId: opt._id, vColor: opt.value });
                } else {
                  update({ vColorId: "", vColor: "" });
                }
              }}
              placeholder="Select color…"
            />
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
            <OptionSelect
              optionSetName="Intake Staff"
              value={v("intakeStaffId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ intakeStaffId: opt._id, intakeStaff: opt.value });
                } else {
                  update({ intakeStaffId: "", intakeStaff: "" });
                }
              }}
              placeholder="Select…"
            />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">Installer</label>
            <OptionSelect
              optionSetName="Installer"
              value={v("installerId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ installerId: opt._id, installer: opt.value });
                } else {
                  update({ installerId: "", installer: "" });
                }
              }}
              placeholder="Select…"
            />
          </div>
          <div className="ncb-field">
            <label className="ncb-label">IST</label>
            <OptionSelect
              optionSetName="IST"
              value={v("istId")}
              onSelect={(opt) => {
                if (opt) {
                  update({ istId: opt._id, ist: opt.value });
                } else {
                  update({ istId: "", ist: "" });
                }
              }}
              placeholder="Select…"
            />
          </div>
        </div>
      </div>
    </>
  );
}
