"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTable, DataTableColumn } from "@/components/data-table";
import { ChangeLogDialog } from "@/components/change-log-dialog";
import { Eye, Pencil, FileText, History, Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobRecord = Record<string, any>;

export function JobsClient({ initialData }: { initialData: JobRecord[] }) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);
  const [logOpen, setLogOpen] = React.useState(false);
  const [activeLogs, setActiveLogs] = React.useState<Array<{ userId: string | null; timestamp: string; field: string; from: unknown; to: unknown }>>([]);
  const [activeRo, setActiveRo] = React.useState("");

  // Auto-poll for jobs with "generating" PDF status
  React.useEffect(() => {
    const hasGenerating = data.some((row) => row.jobOrderPdf === "generating");
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          const stillGenerating = json.data.some((r: JobRecord) => r.jobOrderPdf === "generating");
          if (!stillGenerating) clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  // Fixed column definitions for Jobs table
  const fixedCols: DataTableColumn<JobRecord>[] = React.useMemo(() => [
    { key: "ro", header: "RO #", sortable: true, width: 100 },
    { key: "createdAt", header: "Date", sortable: true, format: "date" as const, width: 120 },
    { key: "clientName", header: "Client Name", sortable: true, width: 180 },
    { key: "clientPhone", header: "Phone", sortable: true, width: 130 },
    { key: "clientEmail", header: "Email", sortable: true, width: 180 },
    { key: "vMake", header: "Make", sortable: true, width: 120 },
    { key: "vModel", header: "Model", sortable: true, width: 120 },
    { key: "vSubmodel", header: "Sub Model", sortable: true, width: 120 },
    { key: "vTrim", header: "Trim", sortable: true, width: 100 },
    { key: "vColor", header: "Color", sortable: true, width: 100 },
    { key: "vPlate", header: "Plate", sortable: true, width: 100 },
    { key: "vin", header: "VIN", sortable: true, width: 160 },
    { key: "mileage", header: "Mileage In", sortable: true, width: 110 },
    { key: "status", header: "Status", sortable: true, width: 110 },
  ], []);

  const actionsColumn: DataTableColumn<JobRecord> = {
    key: "actions",
    header: "Actions",
    sortable: false,
    width: 160,
    render: (_value: unknown, row: JobRecord) => {
      const logs = (row.changeLogs || []) as Array<{ userId: string | null; timestamp: string; field: string; from: unknown; to: unknown }>;
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="View"
            className="ncb-action-btn"
            onClick={() => router.push(`/intake/${row._id}`)}
          >
            <Eye className="size-3.5" />
          </button>
          <button
            title="Edit"
            className="ncb-action-btn"
            onClick={() => router.push(`/intake/${row._id}?mode=edit`)}
          >
            <Pencil className="size-3.5" />
          </button>
          {(() => {
            const pdfReady = row.jobOrderPdf && row.jobOrderPdf !== "generating";
            const isGenerating = row.jobOrderPdf === "generating";
            return (
              <button
                title={pdfReady ? "View PDF" : isGenerating ? "Generating PDF…" : "PDF not available"}
                className={`ncb-action-btn ${!pdfReady ? "opacity-40" : ""}`}
                disabled={isGenerating}
                onClick={() => {
                  if (pdfReady) {
                    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(row.jobOrderPdf)}&embedded=true`;
                    window.open(viewerUrl, "_blank", "noopener,noreferrer");
                  } else if (!isGenerating) {
                    import("sonner").then(({ toast }) =>
                      toast.info("No PDF available. Edit and save the job to generate one.")
                    );
                  }
                }}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </button>
            );
          })()}
          <button
            title="Change Log"
            className="ncb-action-btn"
            onClick={() => {
              setActiveLogs(logs);
              setActiveRo(row.ro || row._id);
              setLogOpen(true);
            }}
          >
            <History className="size-3.5" />
            {logs.length > 0 && (
              <span className="ncb-action-badge">{logs.length}</span>
            )}
          </button>
        </div>
      );
    },
  };

  const columns = React.useMemo(
    () => [...fixedCols, actionsColumn],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixedCols]
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
            onRowClick={(row) => {
              router.push(`/intake/${row._id}`);
            }}
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
