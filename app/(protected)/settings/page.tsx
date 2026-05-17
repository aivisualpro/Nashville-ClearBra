import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSettings } from "@/lib/data";
import { SettingsClient } from "@/components/settings-client";

export default async function SettingsPage() {
  const data = await getSettings();
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 52)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SettingsClient initialData={data as any} />
      </SidebarInset>
    </SidebarProvider>
  );
}
