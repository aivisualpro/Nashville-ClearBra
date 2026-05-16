"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GenericDataTable } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TeamPage() {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", roles: "" });

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Team member added!");
        setOpen(false);
        setForm({ name: "", email: "", phone: "", roles: "" });
        setRefreshKey((k) => k + 1);
      } else {
        toast.error("Failed", { description: result.message });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Team" toolbarPortalId="team-toolbar">
          <Button size="sm" onClick={() => setOpen(true)}>
            <IconPlus className="size-4" /> Add User
          </Button>
        </SiteHeader>
        <div className="flex flex-1 flex-col min-h-0">
          <GenericDataTable
            key={refreshKey}
            apiEndpoint="/api/team"
            emptyLabel="Nashville_Users"
            entityLabel="team members"
            columnOrder={["name","email","roles","phone","notes","techSalary","techHourlyRate","techBillHourlyRate","techLoadedHourlyRate","allowedServices","status"]}
            avatarField="profileImage"
            rowLinkPrefix="/team"
            currencyFields={["techSalary","techHourlyRate","techBillHourlyRate","techLoadedHourlyRate"]}
            defaultSort={{ id: "name", desc: false }}
            toolbarPortalId="team-toolbar"
          />
        </div>
      </SidebarInset>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Input value={form.roles} onChange={(e) => setForm((f) => ({ ...f, roles: e.target.value }))} placeholder="e.g. Tech, Admin" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Adding…" : "Add Member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
