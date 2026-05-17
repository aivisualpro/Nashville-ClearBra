"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Undo2, Loader2 } from "lucide-react";
import { MediaSection } from "@/components/media-section";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobData = Record<string, any>;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = React.useState<JobData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setJob(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: "#E77000" }} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const v = (key: string) => (job?.[key] as string) || "";

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* Full height container — 100% of SidebarInset */}
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

          {/* ═══════════════════════════════════════════════════════════════════
              HEADER — 10% of viewport
           ═══════════════════════════════════════════════════════════════════ */}
          <div style={{
            height: "10vh", minHeight: 72, flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "stretch",
            padding: "0",
          }}>
            {/* Header Column 1 */}
            <div style={{
              flex: 1, borderRight: "1px solid #f1f5f9",
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "0.5rem 1rem",
            }}>
              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => router.push("/jobs")}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    color: "#64748b", fontSize: "0.72rem", fontWeight: 600,
                    padding: "0.15rem 0.35rem", borderRadius: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                >
                  <Undo2 style={{ width: 12, height: 12 }} />
                  Back
                </button>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1e293b" }}>
                  {v("ro") || `Job`}
                </span>
                <span style={{
                  fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase",
                  background: "#E7700015", color: "#E77000", padding: "2px 8px",
                  borderRadius: 10, letterSpacing: "0.04em",
                }}>
                  {v("status") || "New"}
                </span>
              </div>
              {/* Row 2 */}
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                {v("clientName") || "—"}
                {v("clientPhone") && <span style={{ color: "#cbd5e1", margin: "0 6px" }}>·</span>}
                {v("clientPhone")}
              </div>
              {/* Row 3 */}
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>
                {[v("vYear"), v("vMake"), v("vModel"), v("vSubmodel")].filter(Boolean).join(" ") || "No vehicle"}
                {v("vColor") && <span style={{ color: "#cbd5e1", margin: "0 4px" }}>·</span>}
                {v("vColor")}
              </div>
            </div>

            {/* Header Column 2 */}
            <div style={{
              flex: 1, borderRight: "1px solid #f1f5f9",
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "0.5rem 1rem",
            }}>
              {/* Row 1 */}
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Vehicle Details
              </div>
              {/* Row 2 */}
              <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: 600, marginTop: 2 }}>
                VIN: <span style={{ fontWeight: 400, color: "#475569", fontFamily: "monospace", fontSize: "0.72rem" }}>{v("vin") || "—"}</span>
              </div>
              {/* Row 3 */}
              <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                <span>Plate: <strong style={{ color: "#1e293b" }}>{v("vPlate") || "—"}</strong></span>
                <span>Mileage: <strong style={{ color: "#1e293b" }}>{v("mileage") || "—"}</strong></span>
                <span>Trim: <strong style={{ color: "#1e293b" }}>{v("vTrim") || "—"}</strong></span>
              </div>
            </div>

            {/* Header Column 3 */}
            <div style={{
              flex: 1,
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "0.5rem 1rem",
            }}>
              {/* Row 1 */}
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Assignment
              </div>
              {/* Row 2 */}
              <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                <span>Intake: <strong style={{ color: "#1e293b" }}>{v("intakeStaff") || "—"}</strong></span>
                <span>Installer: <strong style={{ color: "#1e293b" }}>{v("installer") || "—"}</strong></span>
              </div>
              {/* Row 3 */}
              <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                <span>Drop-off: <strong style={{ color: "#1e293b" }}>{v("dropOffDate") ? new Date(v("dropOffDate")).toLocaleDateString() : "—"}</strong></span>
                <span>Completion: <strong style={{ color: "#1e293b" }}>{v("completionDate") ? new Date(v("completionDate")).toLocaleDateString() : "—"}</strong></span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              LAYOUT — 90% of viewport — 5 scrollable columns
           ═══════════════════════════════════════════════════════════════════ */}
          <div style={{
            flex: 1, display: "flex", overflow: "hidden",
            background: "#f8fafc",
          }}>
            {/* Column 1 */}
            <div style={{
              flex: 1, minWidth: 0,
              borderRight: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column",
            }}>
              <div style={colHeaderStyle}>Services</div>
              <div style={colBodyStyle}>
                <PlaceholderContent label="Services & packages will be listed here" />
              </div>
            </div>

            {/* Column 2 */}
            <div style={{
              flex: 1, minWidth: 0,
              borderRight: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column",
            }}>
              <div style={colHeaderStyle}>Materials</div>
              <div style={colBodyStyle}>
                <PlaceholderContent label="Materials & inventory tracking" />
              </div>
            </div>

            {/* Column 3 — Timeline (4 sections) */}
            <div style={{
              flex: 1, minWidth: 0,
              borderRight: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column",
            }}>
              <div style={colHeaderStyle}>Operational Assignments</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Technicians */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Technicians</div>
                  <div style={colBodyStyle}>
                    <PlaceholderContent label="Technician assignments" />
                  </div>
                </div>
                {/* QC */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>QC</div>
                  <div style={colBodyStyle}>
                    <PlaceholderContent label="Quality control checks" />
                  </div>
                </div>
                {/* Plotters */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Plotters</div>
                  <div style={colBodyStyle}>
                    <PlaceholderContent label="Plotter assignments" />
                  </div>
                </div>
                {/* Washes */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Washes</div>
                  <div style={colBodyStyle}>
                    <PlaceholderContent label="Wash assignments" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4 */}
            <div style={{
              flex: 1, minWidth: 0,
              borderRight: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column",
            }}>
              <div style={colHeaderStyle}>Notes</div>
              <div style={colBodyStyle}>
                <PlaceholderContent label="Internal notes & instructions" />
              </div>
            </div>

            {/* Column 5 — Files (4 sections) */}
            <div style={{
              flex: 1, minWidth: 0,
              display: "flex", flexDirection: "column",
            }}>
              <div style={colHeaderStyle}>Inspection Media</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Inspection Photos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Inspection Photos</div>
                  <div style={colBodyStyle}>
                    <MediaSection items={(job?.inspectionPhotos as string[]) || []} jobId={id} fieldKey="inspectionPhotos" mediaType="image" accept="image/*" />
                  </div>
                </div>
                {/* Post Inspection Photos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Post Inspection Photos</div>
                  <div style={colBodyStyle}>
                    <MediaSection items={(job?.postInspectionPhotos as string[]) || []} jobId={id} fieldKey="postInspectionPhotos" mediaType="image" accept="image/*" />
                  </div>
                </div>
                {/* Inspection Videos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Inspection Videos</div>
                  <div style={colBodyStyle}>
                    <MediaSection items={(job?.inspectionVideos as string[]) || []} jobId={id} fieldKey="inspectionVideos" mediaType="video" accept="video/*" />
                  </div>
                </div>
                {/* Post Inspection Videos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={sectionHeaderStyle}>Post Inspection Videos</div>
                  <div style={colBodyStyle}>
                    <MediaSection items={(job?.postInspectionVideos as string[]) || []} jobId={id} fieldKey="postInspectionVideos" mediaType="video" accept="video/*" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/* ── Shared styles ─────────────────────────────────────────────────── */

const colHeaderStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#fff",
  borderBottom: "1px solid #e2e8f0",
  background: "#E77000",
  flexShrink: 0,
};

const colBodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "0.75rem",
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  fontSize: "0.65rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#64748b",
  borderBottom: "1px solid #f1f5f9",
  background: "#f8fafc",
  borderLeft: "3px solid #E77000",
  flexShrink: 0,
};

/* ── Placeholder ───────────────────────────────────────────────────── */

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", textAlign: "center",
      color: "#cbd5e1", fontSize: "0.78rem",
      padding: "1rem",
    }}>
      {label}
    </div>
  );
}
