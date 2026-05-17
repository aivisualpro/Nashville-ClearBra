import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VehiclesClient } from "@/components/vehicles-client";

export const metadata = {
  title: "Vehicles | Nashville ClearBra",
  description: "Browse and manage vehicle makes, models, and submodels.",
};

export default function VehiclesPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <VehiclesClient />
      </SidebarInset>
    </SidebarProvider>
  );
}
