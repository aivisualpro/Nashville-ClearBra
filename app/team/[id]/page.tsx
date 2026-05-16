"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconRefresh, IconMail, IconPhone, IconNotes, IconCurrencyDollar, IconEdit, IconDeviceFloppy, IconX, IconCamera, IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserData = Record<string, any>;

/** Format digits to (xxx) xxx-xxxx */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function TeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState<UserData>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch(`/api/team/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setUser(json.data);
          setForm(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => { setForm({ ...user }); setEditing(true); };
  const cancelEdit = () => { setForm({ ...user }); setEditing(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Profile Updated", { description: "Changes saved successfully." });
        setUser({ ...form });
        setEditing(false);
      } else {
        toast.error("Update Failed", { description: result.message || "Could not save." });
      }
    } catch {
      toast.error("Network Error", { description: "Could not connect to the server." });
    } finally { setSaving(false); }
  };

  const setField = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setField("phone", formatPhone(e.target.value));
  };

  const fmtCurrency = (v: unknown) =>
    v != null ? `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  const infoItems = [
    { icon: IconMail, label: "Email", key: "email", type: "email" },
    { icon: IconPhone, label: "Phone", key: "phone", type: "tel" },
    { icon: IconNotes, label: "Notes", key: "notes", type: "text" },
  ];

  const rateItems = [
    { label: "Salary", key: "techSalary" },
    { label: "Hourly Rate", key: "techHourlyRate" },
    { label: "Bill Hourly Rate", key: "techBillHourlyRate" },
    { label: "Loaded Hourly Rate", key: "techLoadedHourlyRate" },
  ];

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 px-4 md:py-6 lg:px-6">

              {/* Top bar */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.push("/team")}>
                  <IconArrowLeft className="size-4" /> Back to Team
                </Button>
                {user && !loading && (
                  editing ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                        <IconX className="size-4" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        <IconDeviceFloppy className="size-4" /> {saving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={startEdit}>
                      <IconEdit className="size-4" /> Edit Profile
                    </Button>
                  )
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <IconRefresh className="text-muted-foreground size-8 animate-spin" />
                </div>
              ) : !user ? (
                <div className="flex items-center justify-center py-24">
                  <p className="text-muted-foreground">User not found.</p>
                </div>
              ) : (
                <>
                  {/* Header Card */}
                  <div className="rounded-xl border bg-card p-6 flex items-center gap-6">
                    {/* Avatar with upload/delete in edit mode */}
                    <div className="relative">
                      {(editing ? form.profileImage : user.profileImage) ? (
                        <img
                          src={editing ? form.profileImage : user.profileImage}
                          alt={user.name || "Profile"}
                          className="size-24 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="size-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                          {(user.name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {editing && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploading(true);
                              try {
                                const fd = new FormData();
                                fd.append("file", file);
                                const res = await fetch("/api/upload", { method: "POST", body: fd });
                                const result = await res.json();
                                if (result.success) {
                                  setField("profileImage", result.url);
                                  toast.success("Image uploaded");
                                } else {
                                  toast.error("Upload failed", { description: result.message });
                                }
                              } catch {
                                toast.error("Upload error");
                              } finally {
                                setUploading(false);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }
                            }}
                          />
                          {/* Camera overlay */}
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            {uploading ? (
                              <IconRefresh className="size-6 text-white animate-spin" />
                            ) : (
                              <IconCamera className="size-6 text-white" />
                            )}
                          </button>
                          {/* Delete button */}
                          {form.profileImage && (
                            <button
                              type="button"
                              onClick={() => { setField("profileImage", null); toast.info("Image removed — save to apply."); }}
                              className="absolute -top-1 -right-1 size-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors cursor-pointer"
                            >
                              <IconTrash className="size-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {editing ? (
                        <Input value={form.name || ""} onChange={(e) => setField("name", e.target.value)} className="text-xl font-bold h-10 w-64" />
                      ) : (
                        <h1 className="text-2xl font-bold">{user.name || "—"}</h1>
                      )}
                      <div className="flex items-center gap-2">
                        {user.roles && (
                          <Badge variant="secondary">{Array.isArray(user.roles) ? user.roles.join(", ") : user.roles}</Badge>
                        )}
                        {user.status === "Active" ? (
                          <Badge className="bg-green-600 text-white">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">{user.status || "—"}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info + Rates Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Info */}
                    <div className="rounded-xl border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                      <div className="flex flex-col gap-4">
                        {infoItems.map((item) => (
                          <div key={item.key} className="flex items-start gap-3">
                            <item.icon className="text-muted-foreground size-5 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              {editing ? (
                                item.key === "phone" ? (
                                  <Input
                                    type="tel"
                                    value={form.phone || ""}
                                    onChange={handlePhoneChange}
                                    placeholder="(555) 123-4567"
                                    className="h-8 mt-1"
                                  />
                                ) : (
                                  <Input
                                    type={item.type}
                                    value={form[item.key] || ""}
                                    onChange={(e) => setField(item.key, e.target.value)}
                                    className="h-8 mt-1"
                                  />
                                )
                              ) : (
                                <p className="text-sm font-medium">{user[item.key] || "—"}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="rounded-xl border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Compensation</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {rateItems.map((item) => (
                          <div key={item.key} className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                            {editing ? (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-sm text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={form[item.key] ?? ""}
                                  onChange={(e) => setField(item.key, e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-8"
                                />
                              </div>
                            ) : (
                              <p className="text-lg font-bold tabular-nums flex items-center gap-1">
                                <IconCurrencyDollar className="size-4 text-muted-foreground" />
                                {user[item.key] != null ? fmtCurrency(user[item.key]).replace("$", "") : "—"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Allowed Services */}
                  {user.allowedServices && (
                    <div className="rounded-xl border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Allowed Services</h2>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(user.allowedServices) ? user.allowedServices : [user.allowedServices]).map((s: string) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
