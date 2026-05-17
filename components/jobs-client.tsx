"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTable, DataTableColumn } from "@/components/data-table";
import { ChangeLogDialog } from "@/components/change-log-dialog";
import { Briefcase, ClipboardList, FileText, History, Loader2, MoreVertical } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobRecord = Record<string, any>;

export function JobsClient({ initialData }: { initialData: JobRecord[] }) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);
  const [logOpen, setLogOpen] = React.useState(false);
  const [activeLogs, setActiveLogs] = React.useState<Array<{ userId: string | null; timestamp: string; field: string; from: unknown; to: unknown }>>([]);
  const [activeRo, setActiveRo] = React.useState("");
  // Always fetch fresh data on mount (SSR cache can be stale)
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success && json.data) setData(json.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Auto-poll while any job has "generating" PDF status
  const pdfStatusKey = data.map((r) => r.jobOrderPdf || "").join(",");
  React.useEffect(() => {
    const hasGenerating = data.some((row) => row.jobOrderPdf === "generating");
    if (!hasGenerating) return;

    let pollCount = 0;
    const maxPolls = 15; // stop after ~60 seconds

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        // Force refresh to clear stale "generating" states
        const res = await fetch("/api/jobs");
        const json = await res.json();
        if (json.success && json.data) setData(json.data);
        return;
      }
      try {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          const still = json.data.some((r: JobRecord) => r.jobOrderPdf === "generating");
          if (!still) clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfStatusKey]);

  // Fixed column definitions for Jobs table
  const fixedCols: DataTableColumn<JobRecord>[] = React.useMemo(() => [
    { key: "ro", header: "RO #", sortable: true, width: 100 },
    { key: "createdAt", header: "Date", sortable: true, format: "date" as const, width: 120 },
    { key: "clientName", header: "Client Name", sortable: true, width: 180 },
    { key: "clientPhone", header: "Phone", sortable: true, width: 130 },
    { key: "clientEmail", header: "Email", sortable: true, width: 180 },
    { key: "vMake", header: "Make", sortable: true, width: 120 },
    { key: "vModel", header: "Model", sortable: true, width: 120 },
    { key: "vPlate", header: "Plate", sortable: true, width: 100 },
    { key: "vin", header: "VIN", sortable: true, width: 160 },
    { key: "status", header: "Status", sortable: true, width: 110 },
  ], []);

  // Kebab menu state: which row's menu is open
  const [menuRowId, setMenuRowId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number; openUp: boolean } | null>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!menuRowId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (menuBtnRef.current?.contains(e.target as Node)) return;
      setMenuRowId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuRowId]);

  const actionsColumn: DataTableColumn<JobRecord> = {
    key: "actions",
    header: "",
    sortable: false,
    width: 50,
    render: (_value: unknown, row: JobRecord) => {
      const logs = (row.changeLogs || []) as Array<{ userId: string | null; timestamp: string; field: string; from: unknown; to: unknown }>;
      const isOpen = menuRowId === row._id;
      const pdfReady = row.jobOrderPdf && row.jobOrderPdf !== "generating";
      const isGenerating = row.jobOrderPdf === "generating";

      return (
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
          <button
            ref={isOpen ? menuBtnRef : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) { setMenuRowId(null); return; }
              const rect = e.currentTarget.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const openUp = spaceBelow < 200 && rect.top > 200;
              setMenuPos({
                top: openUp ? rect.top - 4 : rect.bottom + 4,
                left: rect.right - 160,
                openUp,
              });
              setMenuRowId(row._id);
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0.25rem", borderRadius: 6, display: "flex",
              alignItems: "center", justifyContent: "center",
              color: isOpen ? "#E77000" : "#64748b",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.color = "#1e293b"; }}
            onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.color = "#64748b"; }}
          >
            <MoreVertical className="size-4" />
          </button>

          {isOpen && menuPos && typeof document !== "undefined" && createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuPos.openUp ? undefined : menuPos.top,
                bottom: menuPos.openUp ? window.innerHeight - menuPos.top : undefined,
                left: menuPos.left,
                width: 160,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 9999,
                padding: "4px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* INTAKE */}
              <button
                onClick={() => { setMenuRowId(null); router.push(`/intake/${row._id}`); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", border: "none", background: "none",
                  cursor: "pointer", borderRadius: 7, fontSize: "0.8rem",
                  fontWeight: 600, color: "#1e293b", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <ClipboardList style={{ width: 15, height: 15, color: "#E77000" }} />
                Intake
              </button>

              {/* JOB */}
              <button
                onClick={() => { setMenuRowId(null); router.push(`/job/${row._id}`); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", border: "none", background: "none",
                  cursor: "pointer", borderRadius: 7, fontSize: "0.8rem",
                  fontWeight: 600, color: "#1e293b", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Briefcase style={{ width: 15, height: 15, color: "#3b82f6" }} />
                Job
              </button>

              {/* PDF */}
              <button
                disabled={isGenerating}
                onClick={() => {
                  setMenuRowId(null);
                  if (pdfReady) {
                    window.open(row.jobOrderPdf, "_blank", "noopener,noreferrer");
                  } else if (!isGenerating) {
                    import("sonner").then(({ toast }) =>
                      toast.info("No PDF available. Edit and save the job to generate one.")
                    );
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", border: "none", background: "none",
                  cursor: isGenerating ? "wait" : "pointer", borderRadius: 7,
                  fontSize: "0.8rem", fontWeight: 600, textAlign: "left",
                  color: pdfReady ? "#1e293b" : "#94a3b8",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {isGenerating
                  ? <Loader2 style={{ width: 15, height: 15, color: "#94a3b8" }} className="animate-spin" />
                  : <FileText style={{ width: 15, height: 15, color: pdfReady ? "#10b981" : "#94a3b8" }} />}
                PDF
              </button>

              {/* LOGS */}
              <button
                onClick={() => {
                  setMenuRowId(null);
                  setActiveLogs(logs);
                  setActiveRo(row.ro || row._id);
                  setLogOpen(true);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", border: "none", background: "none",
                  cursor: "pointer", borderRadius: 7, fontSize: "0.8rem",
                  fontWeight: 600, color: "#1e293b", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <History style={{ width: 15, height: 15, color: "#8b5cf6" }} />
                Logs
                {logs.length > 0 && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, background: "#8b5cf6",
                    color: "#fff", borderRadius: 10, padding: "1px 5px", marginLeft: "auto",
                  }}>{logs.length}</span>
                )}
              </button>
            </div>,
            document.body
          )}
        </div>
      );
    },
  };

  const columns = React.useMemo(
    () => [...fixedCols, actionsColumn],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixedCols, menuRowId, menuPos]
  );

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col min-h-0 p-4">
          <DataTable
            data={data}
            columns={columns}
            title="Jobs"
            entityLabel="jobs"
            searchPlaceholder="Search jobs…"
            columnVisibility={false}
            onRefresh={refresh}
            defaultSort={{ id: "createdAt", desc: true }}
            persistKey="jobs"
            batchSize={20}
          />
        </div>
      </SidebarInset>

      <ChangeLogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        logs={activeLogs}
        roNumber={activeRo}
      />
    </SidebarProvider>
  );
}
