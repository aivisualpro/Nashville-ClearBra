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

const MATERIAL_FIELDS: readonly {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
  span2?: boolean;
}[] = [
  { key: "materialName", label: "Material Name", type: "text", required: true },
  { key: "sku", label: "SKU", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "description", label: "Description", type: "text", span2: true },
  { key: "unit", label: "Unit", type: "text" },
  { key: "unitCost", label: "Unit Cost", type: "number" },
  { key: "unitPrice", label: "Unit Price", type: "number" },
  { key: "supplier", label: "Supplier", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
];

type MaterialRecord = Record<string, unknown>;

function emptyForm(): Record<string, string> {
  const f: Record<string, string> = {};
  MATERIAL_FIELDS.forEach((mf) => (f[mf.key] = ""));
  f.status = "Active";
  return f;
}

// ─── Client Component ──────────────────────────────────────────────────────

export function MaterialsClient({ initialData }: { initialData: MaterialRecord[] }) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);

  // Add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForm, setAddForm] = React.useState(emptyForm);
  const [addSaving, setAddSaving] = React.useState(false);

  // Detail / Edit dialog
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<MaterialRecord | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<Record<string, string>>(emptyForm);
  const [editSaving, setEditSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const columns = React.useMemo(
    () => buildColumnsFromData(data, {
      currencyFields: ["unitCost", "unitPrice"],
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
    if (!addForm.materialName) {
      toast.error("Material name is required.");
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update
        setData((prev) => [result.data, ...prev]);
        toast.success("Material added!");
        setAddOpen(false);
        setAddForm(emptyForm());
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
  const openDetail = (row: MaterialRecord) => {
    setSelected(row);
    setEditing(false);
    const f: Record<string, string> = {};
    MATERIAL_FIELDS.forEach((mf) => (f[mf.key] = row[mf.key] != null ? String(row[mf.key]) : ""));
    setEditForm(f);
    setDetailOpen(true);
  };

  // ── Update ─────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selected) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/materials/${selected._id}`, {
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
        toast.success("Material updated!");
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
    if (!confirm("Are you sure you want to delete this material?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/materials/${selected._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        // Optimistic removal
        setData((prev) => prev.filter((item) => item._id !== selected._id));
        toast.success("Material deleted!");
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
      {MATERIAL_FIELDS.map((mf) => (
        <div key={mf.key} className={`flex flex-col gap-1.5 ${mf.span2 ? "sm:col-span-2" : ""}`}>
          <Label className="text-xs">{mf.label}{mf.required ? " *" : ""}</Label>
          {mf.type === "select" && mf.options ? (
            <Select value={form[mf.key] || "Active"} onValueChange={(v) => setForm((f) => ({ ...f, [mf.key]: v }))} disabled={disabled}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {mf.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={mf.type === "number" ? "number" : "text"}
              step={mf.type === "number" ? "0.01" : undefined}
              value={form[mf.key]}
              onChange={(e) => setForm((f) => ({ ...f, [mf.key]: e.target.value }))}
              placeholder={mf.label}
              className="h-8 text-sm"
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );

  const currencyKeys = new Set(["unitCost", "unitPrice"]);
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
            title="Materials"
            entityLabel="materials"
            searchPlaceholder="Search materials…"
            showSidebarToggle
            onRefresh={refresh}
            persistKey="materials"
            batchSize={20}
            onRowClick={openDetail}
            toolbarActions={
              <Button size="sm" onClick={() => { setAddForm(emptyForm()); setAddOpen(true); }}>
                <IconPlus className="size-4" /> Add Material
              </Button>
            }
          />
        </div>
      </SidebarInset>

      {/* ── Add Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          {renderFields(addForm, setAddForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addSaving}>{addSaving ? "Adding…" : "Add Material"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail / Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setEditing(false); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Material" : "Material Details"}</DialogTitle>
          </DialogHeader>

          {editing ? (
            <>
              {renderFields(editForm, setEditForm)}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-auto pr-1">
                {MATERIAL_FIELDS.map((mf) => (
                  <div key={mf.key} className={`flex flex-col gap-0.5 ${mf.span2 ? "sm:col-span-2" : ""}`}>
                    <span className="text-muted-foreground text-xs">{mf.label}</span>
                    {mf.key === "status" ? (
                      <Badge
                        variant={selected?.status === "Active" ? "default" : "outline"}
                        className={`w-fit ${selected?.status === "Active" ? "bg-green-600 text-white" : "text-muted-foreground"}`}
                      >
                        {String(selected?.status || "—")}
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium">{formatVal(mf.key, selected?.[mf.key])}</span>
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
