"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  IconPlus, IconTrash, IconEdit, IconX, IconSearch,
} from "@tabler/icons-react";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { ICON_NAMES, LucideIcon, iconNameToLabel } from "@/lib/icon-registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type OptionItem = { value: string; color: string; icon: string };

// ─── Color Picker Grid ─────────────────────────────────────────────────────

function ColorPicker({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="grid grid-cols-10 gap-1.5 max-h-48 overflow-auto p-1">
      {COLOR_PALETTE.map((hex) => (
        <button
          key={hex}
          type="button"
          className="size-7 rounded-md border-2 transition-all hover:scale-110"
          style={{
            backgroundColor: hex,
            borderColor: selected === hex ? "#fff" : "transparent",
            boxShadow: selected === hex ? `0 0 0 2px ${hex}` : "none",
          }}
          onClick={() => onSelect(hex)}
          title={hex}
        />
      ))}
    </div>
  );
}

// ─── Icon Picker Grid ───────────────────────────────────────────────────────

function IconPicker({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    if (!search) return ICON_NAMES.slice(0, 200); // show first 200 by default
    const q = search.toLowerCase();
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 200);
  }, [search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search icons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-10 gap-1 max-h-56 overflow-auto p-1">
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            className={`size-8 rounded-md flex items-center justify-center transition-all hover:bg-muted ${
              selected === name ? "bg-primary text-primary-foreground ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(name)}
            title={iconNameToLabel(name)}
          >
            <LucideIcon name={name} className="size-4" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-10 text-center text-sm text-muted-foreground py-4">
            No icons match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Option Item Editor Row ─────────────────────────────────────────────────

function OptionItemRow({
  item, index, onChange, onRemove,
}: {
  item: OptionItem;
  index: number;
  onChange: (index: number, field: keyof OptionItem, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showIconPicker, setShowIconPicker] = React.useState(false);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{index + 1}.</span>
      <Input
        value={item.value}
        onChange={(e) => onChange(index, "value", e.target.value)}
        placeholder="Option value"
        className="h-8 text-sm flex-1"
      />

      {/* Color swatch */}
      <div className="relative">
        <button
          type="button"
          className="size-8 rounded-md border-2 border-border shrink-0 transition-all hover:scale-105"
          style={{ backgroundColor: item.color || "#d1d5db" }}
          onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
          title={item.color || "Choose color"}
        />
        {showColorPicker && (
          <div className="absolute right-0 top-10 z-50 bg-popover border rounded-lg shadow-xl p-2 w-[280px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Pick a color</span>
              <button type="button" onClick={() => setShowColorPicker(false)}>
                <IconX className="size-3.5" />
              </button>
            </div>
            <ColorPicker selected={item.color} onSelect={(c) => { onChange(index, "color", c); setShowColorPicker(false); }} />
          </div>
        )}
      </div>

      {/* Icon preview */}
      <div className="relative">
        <button
          type="button"
          className="size-8 rounded-md border border-border flex items-center justify-center shrink-0 transition-all hover:bg-muted"
          onClick={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
          title={item.icon ? iconNameToLabel(item.icon) : "Choose icon"}
        >
          {item.icon ? <LucideIcon name={item.icon} className="size-4" /> : <IconPlus className="size-3.5 text-muted-foreground" />}
        </button>
        {showIconPicker && (
          <div className="absolute right-0 top-10 z-50 bg-popover border rounded-lg shadow-xl p-3 w-[360px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Pick an icon</span>
              <button type="button" onClick={() => setShowIconPicker(false)}>
                <IconX className="size-3.5" />
              </button>
            </div>
            <IconPicker selected={item.icon} onSelect={(n) => { onChange(index, "icon", n); setShowIconPicker(false); }} />
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(index)}>
        <IconTrash className="size-3.5" />
      </Button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function OptionsClient({ initialData }: { initialData: Doc[] }) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [options, setOptions] = React.useState<OptionItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  const resetForm = () => { setName(""); setOptions([]); setEditingId(null); };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (doc: Doc) => {
    setEditingId(doc._id);
    setName(doc.name || "");
    setOptions((doc.options || []).map((o: OptionItem) => ({
      value: o.value || "", color: o.color || "", icon: o.icon || "",
    })));
    setDialogOpen(true);
  };

  const addOptionRow = () => setOptions((prev) => [...prev, { value: "", color: "", icon: "" }]);

  const updateOptionRow = (index: number, field: keyof OptionItem, value: string) => {
    setOptions((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeOptionRow = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), options: options.filter((o) => o.value.trim()) };
      const url = editingId ? `/api/options/${editingId}` : "/api/options";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Option updated" : "Option created");
        if (!editingId && result.data) {
          setData((prev) => [result.data, ...prev]);
        } else {
          setData((prev) => prev.map((d) => d._id === editingId ? { ...d, ...payload, updatedAt: new Date().toISOString() } : d));
        }
        setDialogOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.message || "Save failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this option set?")) return;
    setData((prev) => prev.filter((d) => d._id !== id));
    try {
      const res = await fetch(`/api/options/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error("Delete failed");
        setData(initialData);
      }
    } catch { toast.error("Network error"); setData(initialData); }
  };

  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Options">
          <Button size="sm" onClick={openCreate}>
            <IconPlus className="size-4 mr-1" /> Add Option Set
          </Button>
        </SiteHeader>
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="p-4 lg:p-6 space-y-4">
            {data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p>No option sets yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                  <IconPlus className="size-4 mr-1" /> Create your first
                </Button>
              </div>
            )}

            {data.map((doc) => (
              <div key={doc._id} className="border rounded-lg bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide">{doc.name}</h3>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(doc)}>
                      <IconEdit className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc._id)}>
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(doc.options || []).map((opt: OptionItem, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-sm">
                      {opt.color && <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                      {opt.icon && <LucideIcon name={opt.icon} className="size-3.5 shrink-0" />}
                      <span>{opt.value}</span>
                    </div>
                  ))}
                  {(!doc.options || doc.options.length === 0) && (
                    <span className="text-sm text-muted-foreground">No options defined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Create/Edit Dialog ────────────────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Option Set" : "New Option Set"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Service Status, Vehicle Color, PPF Coverage"
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Options</label>
                  <Button variant="outline" size="sm" onClick={addOptionRow} className="h-7 text-xs">
                    <IconPlus className="size-3 mr-1" /> Add
                  </Button>
                </div>
                {options.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options yet. Click &ldquo;Add&rdquo; to create one.
                  </p>
                )}
                {options.map((item, i) => (
                  <OptionItemRow
                    key={i}
                    item={item}
                    index={i}
                    onChange={updateOptionRow}
                    onRemove={removeOptionRow}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
