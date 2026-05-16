"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTable, buildColumnsFromData } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Field definitions ──────────────────────────────────────────────────────

const SERVICE_FIELDS = [
  { key: "sku", label: "SKU", type: "text" },
  { key: "serviceName", label: "Service Name", type: "text", required: true },
  { key: "category", label: "Category", type: "text" },
  { key: "description", label: "Description", type: "text" },
  { key: "billedHours", label: "Billed Hours", type: "number" },
  { key: "breakEvenPrice", label: "Break Even Price", type: "number" },
  { key: "retailPriceTarget", label: "Retail Price Target", type: "number" },
  { key: "retailPriceMin", label: "Retail Price Min", type: "number" },
  { key: "overheadOutrunPrice", label: "Overhead Outrun Price", type: "number" },
  { key: "wholesalePrice", label: "Wholesale Price", type: "number" },
  { key: "fileSeries", label: "File Series", type: "text" },
  { key: "masterGroup", label: "Master Group", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
] as const;

type ServiceRecord = Record<string, unknown>;

function emptyForm(): Record<string, string> {
  const f: Record<string, string> = {};
  SERVICE_FIELDS.forEach((sf) => (f[sf.key] = ""));
  f.status = "Active";
  return f;
}

// ─── Client Component ──────────────────────────────────────────────────────

export function ServicesClient({ initialData }: { initialData: ServiceRecord[] }) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);

  // Add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForm, setAddForm] = React.useState(emptyForm);
  const [addSaving, setAddSaving] = React.useState(false);

  // Detail / Edit dialog
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ServiceRecord | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<Record<string, string>>(emptyForm);
  const [editSaving, setEditSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const columns = React.useMemo(
    () => buildColumnsFromData(data, {
      columnOrder: [
        "sku", "serviceName", "category", "description", "billedHours",
        "breakEvenPrice", "retailPriceTarget", "retailPriceMin",
        "overheadOutrunPrice", "wholesalePrice", "fileSeries", "masterGroup", "status",
      ],
      currencyFields: [
        "breakEvenPrice", "retailPriceTarget", "retailPriceMin",
        "overheadOutrunPrice", "wholesalePrice",
      ],
    }),
    [data]
  );

  /** Optimistic refresh — re-run server fetch via router.refresh() */
  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  // Sync with server data when initialData changes (after router.refresh)
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // ── Add ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.serviceName) {
      toast.error("Service name is required.");
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update: add to local state immediately
        setData((prev) => [result.data, ...prev]);
        toast.success("Service added!");
        setAddOpen(false);
        setAddForm(emptyForm());
        // Background revalidation
        refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAddSaving(false);
    }
  };

  // ── Row click → detail popup ───────────────────────────────────────
  const openDetail = (row: ServiceRecord) => {
    setSelected(row);
    setEditing(false);
    const f: Record<string, string> = {};
    SERVICE_FIELDS.forEach((sf) => (f[sf.key] = row[sf.key] != null ? String(row[sf.key]) : ""));
    setEditForm(f);
    setDetailOpen(true);
  };

  // ── Update ─────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selected) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/services/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update
        setData((prev) =>
          prev.map((item) =>
            item._id === selected._id ? { ...item, ...editForm } : item
          )
        );
        toast.success("Service updated!");
        setDetailOpen(false);
        refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${selected._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        // Optimistic removal
        setData((prev) => prev.filter((item) => item._id !== selected._id));
        toast.success("Service deleted!");
        setDetailOpen(false);
        refresh();
      } else {
        toast.error("Failed", { description: result.message });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Form renderer (shared for add + edit) ──────────────────────────
  const renderFields = (form: Record<string, string>, setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>, disabled = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-auto pr-1">
      {SERVICE_FIELDS.map((sf) => (
        <div key={sf.key} className={`flex flex-col gap-1.5 ${sf.key === "description" ? "sm:col-span-2" : ""}`}>
          <Label className="text-xs">{sf.label}{"required" in sf && sf.required ? " *" : ""}</Label>
          {sf.type === "select" ? (
            <Select value={form[sf.key] || "Active"} onValueChange={(v) => setForm((f) => ({ ...f, [sf.key]: v }))} disabled={disabled}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sf.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={sf.type === "number" ? "number" : "text"}
              step={sf.type === "number" ? "0.01" : undefined}
              value={form[sf.key]}
              onChange={(e) => setForm((f) => ({ ...f, [sf.key]: e.target.value }))}
              placeholder={sf.label}
              className="h-8 text-sm"
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ── Format currency helper ─────────────────────────────────────────
  const currencyKeys = new Set(["breakEvenPrice", "retailPriceTarget", "retailPriceMin", "overheadOutrunPrice", "wholesalePrice"]);
  const formatVal = (key: string, val: unknown) => {
    if (val == null || val === "") return "—";
    if (currencyKeys.has(key)) return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return String(val);
  };

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
            title="Services"
            entityLabel="services"
            searchPlaceholder="Search services…"
            showSidebarToggle
            onRefresh={refresh}
            defaultSort={{ id: "serviceName", desc: false }}
            persistKey="services"
            batchSize={20}
            onRowClick={openDetail}
            toolbarActions={
              <Button size="sm" onClick={() => { setAddForm(emptyForm()); setAddOpen(true); }}>
                <IconPlus className="size-4" /> Add Service
              </Button>
            }
          />
        </div>
      </SidebarInset>

      {/* ── Add Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          {renderFields(addForm, setAddForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addSaving}>{addSaving ? "Adding…" : "Add Service"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail / Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setEditing(false); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "Service Details"}</DialogTitle>
          </DialogHeader>

          {editing ? (
            /* ── Edit mode ──────────── */
            <>
              {renderFields(editForm, setEditForm)}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</Button>
              </DialogFooter>
            </>
          ) : (
            /* ── View mode ──────────── */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-auto pr-1">
                {SERVICE_FIELDS.map((sf) => (
                  <div key={sf.key} className={`flex flex-col gap-0.5 ${sf.key === "description" ? "sm:col-span-2" : ""}`}>
                    <span className="text-muted-foreground text-xs">{sf.label}</span>
                    {sf.key === "status" ? (
                      <Badge
                        variant={selected?.status === "Active" ? "default" : "outline"}
                        className={`w-fit ${selected?.status === "Active" ? "bg-green-600 text-white" : "text-muted-foreground"}`}
                      >
                        {String(selected?.status || "—")}
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium">{formatVal(sf.key, selected?.[sf.key])}</span>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  <IconTrash className="size-4" /> {deleting ? "Deleting…" : "Delete"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <IconEdit className="size-4" /> Edit
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
