"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronRight, Zap, Shield, Wind, Flame, Star, Gauge } from "lucide-react";

type VehicleOption = { _id: string; name: string; logo?: string };

// ── Brand colours ─────────────────────────────────────────────────────────────
const BRAND: Record<string, { bg: string; text: string }> = {
  "Acura":         { bg: "#B71C1C", text: "#fff" },
  "Alfa Romeo":    { bg: "#8C0000", text: "#fff" },
  "Aston Martin":  { bg: "#004225", text: "#fff" },
  "Audi":          { bg: "#1A1A1A", text: "#fff" },
  "Bentley":       { bg: "#2D5B3F", text: "#fff" },
  "BMW":           { bg: "#1C69D4", text: "#fff" },
  "Buick":         { bg: "#B5944D", text: "#fff" },
  "Cadillac":      { bg: "#1B3A6B", text: "#fff" },
  "Chevrolet":     { bg: "#D4AF37", text: "#000" },
  "Chrysler":      { bg: "#1A1A1A", text: "#fff" },
  "Dodge":         { bg: "#CC0000", text: "#fff" },
  "Ferrari":       { bg: "#CC0000", text: "#fff" },
  "Fiat":          { bg: "#003087", text: "#fff" },
  "Ford":          { bg: "#003478", text: "#fff" },
  "Genesis":       { bg: "#1A1A1A", text: "#fff" },
  "GMC":           { bg: "#CC0000", text: "#fff" },
  "Honda":         { bg: "#CC0000", text: "#fff" },
  "Hyundai":       { bg: "#002C5F", text: "#fff" },
  "Infiniti":      { bg: "#1F1F1F", text: "#fff" },
  "Jaguar":        { bg: "#006C4E", text: "#fff" },
  "Jeep":          { bg: "#3D7D2F", text: "#fff" },
  "Kia":           { bg: "#05141F", text: "#fff" },
  "Lamborghini":   { bg: "#D4AF37", text: "#000" },
  "Land Rover":    { bg: "#004B30", text: "#fff" },
  "Lexus":         { bg: "#1A1A1A", text: "#fff" },
  "Lincoln":       { bg: "#1A1A1A", text: "#fff" },
  "Lotus":         { bg: "#D4AF37", text: "#000" },
  "Lucid":         { bg: "#2E4057", text: "#fff" },
  "Maserati":      { bg: "#003087", text: "#fff" },
  "Mazda":         { bg: "#910A2D", text: "#fff" },
  "McLaren":       { bg: "#FF8000", text: "#fff" },
  "Mercedes-Benz": { bg: "#1A1A1A", text: "#fff" },
  "Mini":          { bg: "#1A1A1A", text: "#fff" },
  "Mitsubishi":    { bg: "#CC0000", text: "#fff" },
  "Nissan":        { bg: "#CC0000", text: "#fff" },
  "Polestar":      { bg: "#1A1A1A", text: "#fff" },
  "Pontiac":       { bg: "#1A1A1A", text: "#fff" },
  "Porsche":       { bg: "#1A1A1A", text: "#fff" },
  "Ram":           { bg: "#CC0000", text: "#fff" },
  "Rivian":        { bg: "#4B9E3F", text: "#fff" },
  "Rolls-Royce":   { bg: "#1A1A1A", text: "#fff" },
  "Saab":          { bg: "#003087", text: "#fff" },
  "Saturn":        { bg: "#1A1A1A", text: "#fff" },
  "Scion":         { bg: "#1A1A1A", text: "#fff" },
  "Subaru":        { bg: "#003087", text: "#fff" },
  "Suzuki":        { bg: "#003087", text: "#fff" },
  "Tesla":         { bg: "#CC0000", text: "#fff" },
  "Toyota":        { bg: "#CC0000", text: "#fff" },
  "Volkswagen":    { bg: "#001E50", text: "#fff" },
  "Volvo":         { bg: "#003F8A", text: "#fff" },
};

// ── Logo component — url stored in Nashville_Make.logo (Cloudinary) ───────────
function MakeLogo({ name, url, size = 28 }: { name: string; url?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const brand = BRAND[name] || { bg: "#E77000", text: "#fff" };
  if (err || !url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: brand.bg, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 800, color: brand.text, flexShrink: 0,
      }}>
        {name[0]}
      </div>
    );
  }
  return (
    <img src={url} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, display: "block" }} />
  );
}

// ── Trim badge logic ──────────────────────────────────────────────────────────
function getTrimStyle(name: string): { icon: React.ReactNode; accent: string; label: string } {
  const n = name.toLowerCase();
  if (n.includes("ev") || n.includes("electric") || n.includes("bev"))
    return { icon: <Zap className="size-3" />, accent: "#8b5cf6", label: "Electric" };
  if (n.includes("hybrid") || n.includes("phev"))
    return { icon: <Zap className="size-3" />, accent: "#0ea5e9", label: "Hybrid" };
  if (n.includes("awd") || n.includes("4wd") || n.includes("4x4"))
    return { icon: <Shield className="size-3" />, accent: "#059669", label: "AWD" };
  if (n.includes("turbo"))
    return { icon: <Wind className="size-3" />, accent: "#E77000", label: "Turbo" };
  if (n.includes("sport") || n.includes("gt") || n.includes("rs") || n.includes("amg"))
    return { icon: <Flame className="size-3" />, accent: "#dc2626", label: "Sport" };
  if (n.includes("premium") || n.includes("luxury") || n.includes("platinum") || n.includes("ultra"))
    return { icon: <Star className="size-3" />, accent: "#d4af37", label: "Premium" };
  return { icon: <Gauge className="size-3" />, accent: "#64748b", label: "Trim" };
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  return (json.data || []) as VehicleOption[];
}

// ── Main Component ────────────────────────────────────────────────────────────
export function VehiclesClient() {
  const [makes, setMakes]               = useState<VehicleOption[]>([]);
  const [selectedMake, setSelectedMake] = useState<VehicleOption | null>(null);
  const [models, setModels]             = useState<VehicleOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<VehicleOption | null>(null);
  const [subModels, setSubModels]       = useState<VehicleOption[]>([]);
  const [makeSearch, setMakeSearch]     = useState("");
  const [subSearch, setSubSearch]       = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingSubs, setLoadingSubs]   = useState(false);

  // Load makes
  useEffect(() => {
    apiFetch("/api/vehicles?type=makes").then(setMakes);
  }, []);

  // Load models when make changes → auto-select first
  useEffect(() => {
    if (!selectedMake) { setModels([]); setSelectedModel(null); setSubModels([]); return; }
    setLoadingModels(true);
    setSelectedModel(null);
    setSubModels([]);
    apiFetch(`/api/vehicles?type=models&makeId=${selectedMake._id}`).then((data) => {
      setModels(data);
      setLoadingModels(false);
      if (data.length > 0) setSelectedModel(data[0]);
    });
  }, [selectedMake]);

  // Load submodels when model changes
  useEffect(() => {
    if (!selectedModel) { setSubModels([]); return; }
    setLoadingSubs(true);
    apiFetch(`/api/vehicles?type=submodels&modelId=${selectedModel._id}`).then((data) => {
      setSubModels(data);
      setLoadingSubs(false);
    });
  }, [selectedModel]);

  const filteredMakes = makeSearch.trim()
    ? makes.filter((m) => m.name.toLowerCase().includes(makeSearch.toLowerCase()))
    : makes;

  const filteredSubs = subSearch.trim()
    ? subModels.filter((s) => s.name.toLowerCase().includes(subSearch.toLowerCase()))
    : subModels;

  const brand = selectedMake ? (BRAND[selectedMake.name] || { bg: "#E77000", text: "#fff" }) : null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "inherit" }}>

      {/* ═══ Panel 1: Make sidebar ═══════════════════════════════════════════ */}
      <div style={{
        width: 256, flexShrink: 0,
        background: "#fff", borderRight: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "0.875rem 0.875rem 0.5rem", flexShrink: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Make
          </div>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
            <input
              value={makeSearch} onChange={(e) => setMakeSearch(e.target.value)}
              placeholder="Search makes…"
              style={{
                width: "100%", padding: "0.35rem 0.5rem 0.35rem 1.875rem",
                border: "1px solid #e2e8f0", borderRadius: 7,
                fontSize: "0.78rem", color: "#1e293b", background: "#f8fafc",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.25rem 0.5rem 0.5rem" }}>
          {/* All */}
          <button
            onClick={() => setSelectedMake(null)}
            style={{
              width: "100%", padding: "0.5rem 0.625rem", marginBottom: 2,
              border: "none", borderRadius: 7, cursor: "pointer", textAlign: "left",
              background: !selectedMake ? "rgba(231,112,0,0.1)" : "transparent",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: !selectedMake ? "#E77000" : "#f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 800, color: !selectedMake ? "#fff" : "#94a3b8",
            }}>
              ALL
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: !selectedMake ? 700 : 500, color: !selectedMake ? "#E77000" : "#475569" }}>
              All Makes
            </span>
            {!selectedMake && <ChevronRight style={{ width: 12, height: 12, color: "#E77000", marginLeft: "auto" }} />}
          </button>

          <div style={{ height: 1, background: "#f1f5f9", margin: "0.25rem 0.25rem 0.375rem" }} />

          {filteredMakes.map((make) => {
            const active = selectedMake?._id === make._id;
            return (
              <button key={make._id} onClick={() => setSelectedMake(active ? null : make)} style={{
                width: "100%", padding: "0.45rem 0.625rem", marginBottom: 1,
                border: "none", borderRadius: 7, cursor: "pointer", textAlign: "left",
                background: active ? "rgba(231,112,0,0.08)" : "transparent",
                display: "flex", alignItems: "center", gap: 10, transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <MakeLogo name={make.name} url={make.logo} size={26} />
                <span style={{ fontSize: "0.81rem", fontWeight: active ? 700 : 400, color: active ? "#E77000" : "#374151", flex: 1 }}>
                  {make.name}
                </span>
                {active && <ChevronRight style={{ width: 12, height: 12, color: "#E77000" }} />}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "0.5rem 0.875rem", borderTop: "1px solid #f1f5f9", fontSize: "0.68rem", color: "#94a3b8" }}>
          {makes.length} makes total
        </div>
      </div>

      {/* ═══ Panel 2: Models (slides in) ═════════════════════════════════════ */}
      <div style={{
        width: selectedMake ? 210 : 0, flexShrink: 0,
        borderRight: selectedMake ? "1px solid #e2e8f0" : "none",
        background: "#fff", display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "width 0.2s ease",
      }}>
        {selectedMake && (
          <>
            {/* Brand header */}
            <div style={{
              padding: "0.625rem 0.75rem",
              background: "#fff",
              flexShrink: 0, borderBottom: `2px solid ${brand!.bg}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MakeLogo name={selectedMake.name} url={selectedMake.logo} size={24} />
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: brand!.bg }}>{selectedMake.name}</div>
                  <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                    {loadingModels ? "Loading…" : `${models.length} models`}
                  </div>
                </div>
              </div>
            </div>

            {/* Model list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.375rem" }}>
              {models.map((model) => {
                const active = selectedModel?._id === model._id;
                return (
                  <button key={model._id} onClick={() => setSelectedModel(model)} style={{
                    width: "100%", padding: "0.5rem 0.625rem", marginBottom: 2,
                    border: active ? `1.5px solid ${brand!.bg}` : "1.5px solid transparent",
                    borderRadius: 7, cursor: "pointer", textAlign: "left",
                    background: active ? `${brand!.bg}12` : "transparent",
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: active ? brand!.bg : "#d1d5db",
                    }} />
                    <span style={{ fontSize: "0.79rem", fontWeight: active ? 700 : 400, color: active ? "#1e293b" : "#4b5563", flex: 1 }}>
                      {model.name}
                    </span>
                    {active && <ChevronRight style={{ width: 11, height: 11, color: brand!.bg }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══ Panel 3: Main content ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>

        {/* No make selected → All makes grid */}
        {!selectedMake && (
          <>
            <div style={{ padding: "1rem 1.25rem 0.5rem", borderBottom: "1px solid #e2e8f0", background: "#fff", flexShrink: 0 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>All Vehicle Makes</div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{makes.length} brands — select one to explore models</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
                {makes.map((make) => {
                  const b = BRAND[make.name] || { bg: "#E77000", text: "#fff" };
                  return (
                    <button key={make._id} onClick={() => setSelectedMake(make)} style={{
                      padding: "1.25rem 0.75rem", borderRadius: 12,
                      border: "1.5px solid #e2e8f0", background: "#fff",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 10, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = b.bg;
                      e.currentTarget.style.boxShadow = `0 4px 12px ${b.bg}22`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}>
                      <MakeLogo name={make.name} url={make.logo} size={80} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", textAlign: "center" }}>
                        {make.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Make selected → Submodels panel */}
        {selectedMake && (
          <>
            {/* Header */}
            <div style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid #e2e8f0",
              background: "#fff", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MakeLogo name={selectedMake.name} url={selectedMake.logo} size={28} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{selectedMake.name}</span>
                    {selectedModel && (
                      <>
                        <ChevronRight style={{ width: 12, height: 12, color: "#d1d5db" }} />
                        <span style={{ fontWeight: 700, color: brand!.bg }}>{selectedModel.name}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>
                    {loadingSubs ? "Loading…" : `${subModels.length} submodel${subModels.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
                <input
                  value={subSearch} onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Filter trims…"
                  style={{
                    padding: "0.3rem 0.5rem 0.3rem 1.75rem",
                    border: "1px solid #e2e8f0", borderRadius: 6,
                    fontSize: "0.78rem", color: "#1e293b", background: "#f8fafc",
                    outline: "none", width: 170,
                  }}
                />
              </div>
            </div>

            {/* Submodels grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>
              {loadingSubs ? (
                <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Loading submodels…</div>
              ) : filteredSubs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: "0.82rem" }}>
                  {subModels.length === 0 ? "No submodels for this model" : "No trims match your search"}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                  {filteredSubs.map((sub) => {
                    const { icon, accent, label } = getTrimStyle(sub.name);
                    return (
                      <div key={sub._id} style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        overflow: "hidden",
                        transition: "all 0.15s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = accent;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${accent}18`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "none";
                      }}>
                        {/* Accent bar */}
                        <div style={{ height: 3, background: accent }} />

                        <div style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Icon */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: `${accent}12`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: accent,
                          }}>
                            {icon}
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{sub.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 1 }}>
                              {selectedMake.name} {selectedModel?.name}
                            </div>
                          </div>

                          {/* Badge */}
                          <span style={{
                            fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                            color: accent, background: `${accent}10`,
                            padding: "0.2rem 0.4rem", borderRadius: 4, flexShrink: 0,
                          }}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
