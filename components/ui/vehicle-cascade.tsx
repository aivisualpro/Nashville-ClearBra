"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type VehicleOption = { _id: string; name: string };

// ── Module-level cache for makes (only fetched once) ──────────────────
let _makesCache: VehicleOption[] | null = null;
let _makesPromise: Promise<VehicleOption[]> | null = null;

async function fetchMakes(): Promise<VehicleOption[]> {
  if (_makesCache && _makesCache.length > 0) return _makesCache;
  if (_makesPromise) return _makesPromise;
  _makesPromise = fetch("/api/vehicle?type=makes")
    .then((r) => r.json())
    .then((j) => {
      const data: VehicleOption[] = j.data || [];
      if (data.length > 0) {
        _makesCache = data;
      } else {
        // Don't cache empty — allow retry on next mount
        _makesPromise = null;
      }
      return data;
    })
    .catch(() => { _makesPromise = null; return []; });
  return _makesPromise;
}

async function fetchModels(makeId: string): Promise<VehicleOption[]> {
  const res = await fetch(`/api/vehicle?type=models&makeId=${makeId}`);
  const json = await res.json();
  return json.data || [];
}

async function fetchSubModels(makeId: string, modelId: string): Promise<VehicleOption[]> {
  const res = await fetch(`/api/vehicle?type=submodels&makeId=${makeId}&modelId=${modelId}`);
  const json = await res.json();
  return json.data || [];
}

// ── Dropdown component with Portal ─────────────────────────────────────
function VehicleDropdown({
  label,
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Select…",
  disabled = false,
  loading = false,
}: {
  label: string;
  options: VehicleOption[];
  value: string;
  onChange: (opt: VehicleOption | null) => void;
  onAddNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const DROPDOWN_HEIGHT = 264; // max-height + padding

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      // Check if click is inside the trigger or the portal dropdown
      if (ref.current?.contains(target)) return;
      const portal = document.getElementById(`vcascade-portal-${label}`);
      if (portal?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open, label]);

  // Position the portal dropdown relative to trigger button
  React.useEffect(() => {
    if (!open || !ref.current) return;
    const updateRect = () => {
      if (ref.current) setRect(ref.current.getBoundingClientRect());
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const selected = options.find((o) => o._id === value);
  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const showAddNew = onAddNew && search.trim().length > 0 && !filtered.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleAddNew = () => {
    if (onAddNew && search.trim()) {
      onAddNew(search.trim());
      setOpen(false);
      setSearch("");
    }
  };

  // Smart positioning — open upward if not enough space below
  const openUpward = rect
    ? (window.innerHeight - rect.bottom) < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT
    : false;

  // Render dropdown list into a portal so it escapes overflow:hidden ancestors
  const dropdownList = open && rect ? createPortal(
    <div
      id={`vcascade-portal-${label}`}
      style={{
        position: "fixed",
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        background: "#fff",
        color: "#111827",
        colorScheme: "light",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: openUpward
          ? "0 -8px 24px rgba(0,0,0,0.14)"
          : "0 8px 24px rgba(0,0,0,0.14)",
        zIndex: 9999,
        maxHeight: 260,
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
      }}
    >
      <div style={{ padding: "8px 8px 4px" }}>
        <input
          autoFocus
          type="text"
          placeholder={`Search ${label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && showAddNew) handleAddNew();
          }}
          style={{
            width: "100%", padding: "6px 10px", fontSize: "0.82rem",
            border: "1px solid #e5e7eb", borderRadius: 6, outline: "none",
            background: "#fff", color: "#111827", colorScheme: "light",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#E77000")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>
      <div style={{ overflow: "auto", flex: 1, padding: "4px 4px 6px" }}>
        {selected && (
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); setSearch(""); }}
            style={{
              width: "100%", padding: "6px 10px", border: "none", background: "none",
              cursor: "pointer", textAlign: "left", fontSize: "0.8rem",
              color: "#9ca3af", borderRadius: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ✕ Clear
          </button>
        )}
        {filtered.length === 0 && !showAddNew && (
          <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "0.8rem" }}>
            No results
          </div>
        )}
        {filtered.map((opt) => (
          <button
            key={opt._id}
            type="button"
            onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
            style={{
              width: "100%", padding: "7px 10px", border: "none",
              background: opt._id === value ? "#fff7ed" : "transparent",
              color: opt._id === value ? "#c2410c" : "#111827",
              cursor: "pointer", textAlign: "left", borderRadius: 6,
              fontSize: "0.85rem", display: "flex", justifyContent: "space-between",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = opt._id === value ? "#fff7ed" : "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = opt._id === value ? "#fff7ed" : "transparent";
            }}
          >
            <span style={{ color: opt._id === value ? "#c2410c" : "#111827" }}>{opt.name}</span>
            {opt._id === value && <span style={{ color: "#E77000" }}>✓</span>}
          </button>
        ))}
        {showAddNew && (
          <button
            type="button"
            onClick={handleAddNew}
            style={{
              width: "100%", padding: "8px 10px", border: "none",
              background: "none", cursor: "pointer", textAlign: "left",
              borderRadius: 6, fontSize: "0.82rem", display: "flex",
              alignItems: "center", gap: 6, color: "#E77000", fontWeight: 600,
              borderTop: filtered.length > 0 ? "1px solid #f3f4f6" : "none",
              marginTop: filtered.length > 0 ? 2 : 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>＋</span>
            Add &ldquo;{search.trim()}&rdquo;
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="ncb-field">
      <label className="ncb-label">{label}</label>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          className="ncb-input"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", width: "100%",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: "0.85rem", color: selected ? "#1f2937" : "#9ca3af" }}>
            {loading ? "Loading…" : selected ? selected.name : placeholder}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {dropdownList}
      </div>
    </div>
  );
}

// ── Main cascading component ───────────────────────────────────────────
type Props = {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  subModelId: string;
  subModelName: string;
  onUpdate: (fields: Record<string, unknown>) => void;
};

export function VehicleCascade({ makeId, makeName, modelId, modelName, subModelId, subModelName, onUpdate }: Props) {
  const [makes, setMakes] = React.useState<VehicleOption[]>(() => _makesCache || []);
  const [models, setModels] = React.useState<VehicleOption[]>([]);
  const [subModels, setSubModels] = React.useState<VehicleOption[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [loadingSubs, setLoadingSubs] = React.useState(false);

  // Fetch makes
  React.useEffect(() => {
    fetchMakes().then(setMakes);
  }, []);

  // Fetch models when makeId changes
  React.useEffect(() => {
    if (!makeId) { setModels([]); return; }
    setLoadingModels(true);
    fetchModels(makeId).then((m) => {
      setModels(m);
      setLoadingModels(false);
      // If editing and modelId exists, pre-select it — keep the data
      // But if this is a NEW make selection, clear model/submodel
    });
  }, [makeId]);

  // Fetch submodels when modelId changes
  React.useEffect(() => {
    if (!makeId || !modelId) { setSubModels([]); return; }
    setLoadingSubs(true);
    fetchSubModels(makeId, modelId).then((s) => {
      setSubModels(s);
      setLoadingSubs(false);
    });
  }, [makeId, modelId]);

  // Reconcile: if makeName exists but no makeId (old data), try to find match in the list
  React.useEffect(() => {
    if (makeName && !makeId && makes.length > 0) {
      const match = makes.find((m) => m.name.toLowerCase() === makeName.toLowerCase());
      if (match) {
        onUpdate({ vMakeId: match._id, vMake: match.name });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makes, makeName, makeId]);

  // ── "Add New" handlers (create via API then select) ──────────────
  const handleAddMake = async (name: string) => {
    try {
      const res = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "make", name }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const opt: VehicleOption = { _id: json.data._id || json.data.insertedId, name };
        _makesCache = null;
        _makesPromise = null;
        setMakes((prev) => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
        onUpdate({ vMakeId: opt._id, vMake: opt.name, vModelId: "", vModel: "", vSubmodelId: "", vSubmodel: "" });
      }
    } catch { /* toast handled elsewhere */ }
  };

  const handleAddModel = async (name: string) => {
    if (!makeId) return;
    try {
      const res = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "model", makeId, name }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const opt: VehicleOption = { _id: json.data._id || json.data.insertedId, name };
        setModels((prev) => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
        onUpdate({ vModelId: opt._id, vModel: opt.name, vSubmodelId: "", vSubmodel: "" });
      }
    } catch { /* */ }
  };

  const handleAddSubmodel = async (name: string) => {
    if (!makeId || !modelId) return;
    try {
      const res = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "submodel", makeId, modelId, name }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const opt: VehicleOption = { _id: json.data._id || json.data.insertedId, name };
        setSubModels((prev) => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
        onUpdate({ vSubmodelId: opt._id, vSubmodel: opt.name });
      }
    } catch { /* */ }
  };

  return (
    <>
      <VehicleDropdown
        label="Make"
        options={makes}
        value={makeId}
        onChange={(opt) => {
          if (opt) {
            onUpdate({ vMakeId: opt._id, vMake: opt.name, vModelId: "", vModel: "", vSubmodelId: "", vSubmodel: "" });
          } else {
            onUpdate({ vMakeId: "", vMake: "", vModelId: "", vModel: "", vSubmodelId: "", vSubmodel: "" });
          }
        }}
        onAddNew={handleAddMake}
        placeholder="Select make…"
      />
      <VehicleDropdown
        label="Model"
        options={models}
        value={modelId}
        onChange={(opt) => {
          if (opt) {
            onUpdate({ vModelId: opt._id, vModel: opt.name, vSubmodelId: "", vSubmodel: "" });
          } else {
            onUpdate({ vModelId: "", vModel: "", vSubmodelId: "", vSubmodel: "" });
          }
        }}
        onAddNew={handleAddModel}
        placeholder="Select model…"
        disabled={!makeId}
        loading={loadingModels}
      />
      <VehicleDropdown
        label="Submodel"
        options={subModels}
        value={subModelId}
        onChange={(opt) => {
          if (opt) {
            onUpdate({ vSubmodelId: opt._id, vSubmodel: opt.name });
          } else {
            onUpdate({ vSubmodelId: "", vSubmodel: "" });
          }
        }}
        onAddNew={handleAddSubmodel}
        placeholder="Select submodel…"
        disabled={!modelId}
        loading={loadingSubs}
      />
    </>
  );
}
