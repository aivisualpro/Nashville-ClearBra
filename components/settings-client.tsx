"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Settings, Pencil, Check, X, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type SettingItem = {
  _id?: string;
  key: string;
  label: string;
  dataType: "percentageValues" | "dollarValues" | "Number";
  value: string;
  order: number;
};

type Props = { initialData: SettingItem[] };

const DEFAULT_SETTINGS: Omit<SettingItem, "_id">[] = [
  { key: "salesmanCommissionRate",  label: "Salesman Commission Rate",   dataType: "percentageValues", value: "8.50",   order: 1  },
  { key: "techEmployerTaxRate",     label: "Tech Employer Tax Rate",     dataType: "percentageValues", value: "10.00",  order: 2  },
  { key: "salesmanEmployerTaxRate", label: "SalesMan Employer Tax Rate", dataType: "percentageValues", value: "10.00",  order: 3  },
  { key: "upsellCommissionRate",    label: "Upsell Commission Rate",     dataType: "percentageValues", value: "2.50",   order: 4  },
  { key: "salesmanUpsellBonusRate", label: "Salesman Upsell Bonus Rate", dataType: "percentageValues", value: "2.00",   order: 5  },
  { key: "techHoursPerYear",        label: "Tech Hours Per Year",        dataType: "Number",           value: "1944",   order: 6  },
  { key: "ohcHrQ1",                 label: "OHC HR Q1",                  dataType: "dollarValues",     value: "125.00", order: 7  },
  { key: "ohcHrQ2",                 label: "OHC HR Q2",                  dataType: "dollarValues",     value: "125.00", order: 8  },
  { key: "ohcHrQ3",                 label: "OHC HR Q3",                  dataType: "dollarValues",     value: "125.00", order: 9  },
  { key: "ohcHrQ4",                 label: "OHC HR Q4",                  dataType: "dollarValues",     value: "125.00", order: 10 },
  { key: "retPpfLaborCostHr",       label: "RET PPF Labor Cost/Hr",      dataType: "dollarValues",     value: "45.00",  order: 11 },
  { key: "retTintLaborCostHr",      label: "RET Tint Labor Cost/Hr",     dataType: "dollarValues",     value: "45.00",  order: 12 },
  { key: "retStraightLaborCostHr",  label: "RET Straight Labor Cost/Hr", dataType: "dollarValues",     value: "45.00",  order: 13 },
  { key: "retCeramicLaborCostHr",   label: "RET Ceramic Labor Cost/Hr",  dataType: "dollarValues",     value: "45.00",  order: 14 },
  { key: "whoPpfLaborCostHr",       label: "WHO PPF Labor Cost/Hr",      dataType: "dollarValues",     value: "45.00",  order: 15 },
  { key: "whoTintLaborCostHr",      label: "WHO Tint Labor Cost/Hr",     dataType: "dollarValues",     value: "45.00",  order: 16 },
  { key: "whoStraightLaborCostHr",  label: "WHO Straight Labor Cost/Hr", dataType: "dollarValues",     value: "45.00",  order: 17 },
  { key: "whoCeramicLaborCostHr",   label: "WHO Ceramic Labor Cost/Hr",  dataType: "dollarValues",     value: "45.00",  order: 18 },
];

function mergeWithDefaults(saved: SettingItem[]): SettingItem[] {
  const map = new Map(saved.map((s) => [s.key, s]));
  return DEFAULT_SETTINGS.map((def) => map.get(def.key) ?? { ...def });
}

function formatValue(item: SettingItem): string {
  const n = parseFloat(item.value);
  if (isNaN(n)) return item.value;
  if (item.dataType === "percentageValues") return `${n.toFixed(2)}%`;
  if (item.dataType === "dollarValues") return `$${n.toFixed(2)}`;
  return Number.isInteger(n) ? String(n) : String(n);
}

// ── Individual editable row ───────────────────────────────────────────────────
function SettingRow({
  item,
  onSaved,
}: {
  item: SettingItem;
  onSaved: (key: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset draft when item changes externally
  useEffect(() => { setDraft(item.value); }, [item.value]);

  const startEdit = () => {
    setDraft(item.value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(item.value);
  };

  const save = async () => {
    if (draft === item.value) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.key, value: draft }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved(item.key, draft);
        setEditing(false);
        toast.success("Saved", { description: item.label });
      } else {
        toast.error("Save failed", { description: json.message });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.55rem 0.875rem",
      borderBottom: "1px solid #f1f5f9",
      gap: "0.5rem",
    }}>
      {/* Label */}
      <span style={{ fontSize: "0.82rem", color: "#475569", flex: 1, minWidth: 0 }}>
        {item.label}
      </span>

      {/* Value display or inline edit */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {editing ? (
          <>
            {item.dataType === "dollarValues" && (
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>$</span>
            )}
            <input
              ref={inputRef}
              type="number"
              step={item.dataType === "Number" ? "1" : "0.01"}
              min="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              style={{
                width: 72, padding: "0.25rem 0.4rem",
                border: "1.5px solid #E77000", borderRadius: 5,
                fontSize: "0.85rem", fontWeight: 700, color: "#1e293b",
                textAlign: "right", background: "#fff", outline: "none",
              }}
            />
            {item.dataType === "percentageValues" && (
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>%</span>
            )}
            {/* Confirm */}
            <button
              onClick={save}
              disabled={saving}
              title="Save"
              style={{
                width: 24, height: 24, borderRadius: 5, border: "none",
                background: "#E77000", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {saving
                ? <Loader2 className="size-3 animate-spin" style={{ color: "#fff" }} />
                : <Check className="size-3" style={{ color: "#fff" }} />
              }
            </button>
            {/* Cancel */}
            <button
              onClick={cancel}
              title="Cancel"
              style={{
                width: 24, height: 24, borderRadius: 5, border: "1px solid #e2e8f0",
                background: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X className="size-3" style={{ color: "#94a3b8" }} />
            </button>
          </>
        ) : (
          <>
            <span style={{
              fontSize: "0.875rem", fontWeight: 700, color: "#1e293b",
              minWidth: 48, textAlign: "right",
            }}>
              {formatValue(item)}
            </span>
            <button
              onClick={startEdit}
              title="Edit"
              style={{
                width: 24, height: 24, borderRadius: 5, border: "1px solid #e2e8f0",
                background: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "border-color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E77000")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            >
              <Pencil className="size-3" style={{ color: "#94a3b8" }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Group box ─────────────────────────────────────────────────────────────────
function GroupBox({
  title,
  accent,
  items,
  onSaved,
}: {
  title: string;
  accent: string;
  items: SettingItem[];
  onSaved: (key: string, value: string) => void;
}) {
  return (
    <div style={{
      border: "1.5px solid #e2e8f0", borderRadius: 10,
      overflow: "hidden", background: "#fff",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "0.55rem 0.875rem",
        background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
      }}>
        <div style={{ width: 3, height: 14, borderRadius: 4, background: accent, flexShrink: 0 }} />
        <span style={{
          fontSize: "0.72rem", fontWeight: 700, color: "#475569",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {title}
        </span>
      </div>
      <div>
        {items.map((item, i) => (
          <div key={item.key} style={{ borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            <SettingRow item={item} onSaved={onSaved} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Group definitions ─────────────────────────────────────────────────────────
const GROUPS: { title: string; keys: string[]; accent: string }[] = [
  { title: "Commission & Tax Rates",            keys: ["salesmanCommissionRate","techEmployerTaxRate","salesmanEmployerTaxRate","upsellCommissionRate","salesmanUpsellBonusRate"], accent: "#7c3aed" },
  { title: "Labor Hours",                        keys: ["techHoursPerYear"],                                                                                                       accent: "#2563eb" },
  { title: "Overhead Cost Per Hour (Quarterly)", keys: ["ohcHrQ1","ohcHrQ2","ohcHrQ3","ohcHrQ4"],                                                                                  accent: "#059669" },
  { title: "Retail Labor Cost Per Hour",         keys: ["retPpfLaborCostHr","retTintLaborCostHr","retStraightLaborCostHr","retCeramicLaborCostHr"],                                accent: "#0ea5e9" },
  { title: "Wholesale Labor Cost Per Hour",      keys: ["whoPpfLaborCostHr","whoTintLaborCostHr","whoStraightLaborCostHr","whoCeramicLaborCostHr"],                                accent: "#f59e0b" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [{ id: "general", label: "General Settings", icon: Settings }] as const;
type TabId = (typeof TABS)[number]["id"];

export function SettingsClient({ initialData }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<SettingItem[]>(() => mergeWithDefaults(initialData));

  useEffect(() => {
    if (initialData.length === 0) handleSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaved = useCallback((key: string, value: string) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  }, []);

  const handleSeed = async () => {
    try {
      await fetch("/api/settings", { method: "POST" });
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) setSettings(mergeWithDefaults(json.data));
    } catch { /* silent */ }
  };

  const byKey = new Map(settings.map((s) => [s.key, s]));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Tab bar — no global save button */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 1rem", display: "flex", alignItems: "center", flexShrink: 0,
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              height: 44, padding: "0 1rem", border: "none", background: "none",
              cursor: "pointer", fontSize: "0.82rem", fontWeight: active ? 700 : 500,
              color: active ? "#E77000" : "#64748b",
              borderBottom: active ? "2px solid #E77000" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon className="size-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content — 3 columns on desktop */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {activeTab === "general" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            alignItems: "start",
          }}>
            {GROUPS.map((group) => {
              const items = group.keys.map((k) => byKey.get(k)).filter(Boolean) as SettingItem[];
              if (!items.length) return null;
              return (
                <GroupBox
                  key={group.title}
                  title={group.title}
                  accent={group.accent}
                  items={items}
                  onSaved={handleSaved}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
