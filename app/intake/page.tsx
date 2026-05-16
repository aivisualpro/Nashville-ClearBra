"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { IntakeWizard } from "@/components/intake/intake-wizard";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

function IntakeHeaderAuth({ title }: { title: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center px-4 lg:px-6 py-3">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-4" />
      </Button>
      <h1 className="flex-1 text-center text-xl font-bold tracking-wide" style={{ color: "#E77000" }}>
        {title}
      </h1>
      <div className="size-7 shrink-0" />
    </div>
  );
}

function IntakeHeaderPublic({ title }: { title: string }) {
  return (
    <div className="flex items-center px-4 lg:px-6 py-3">
      <h1 className="flex-1 text-center text-xl font-bold tracking-wide" style={{ color: "#E77000" }}>
        {title}
      </h1>
    </div>
  );
}

export default function IntakePage() {
  const { data: session, status } = useSession();
  const [stepTitle, setStepTitle] = useState("Customer + Vehicle Information");
  const isAuth = status === "authenticated" && !!session;

  // Authenticated: show sidebar
  if (isAuth) {
    return (
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="intake-layout flex flex-col h-screen overflow-hidden">
            <IntakeHeaderAuth title={stepTitle} />
            <div className="flex-1 min-h-0">
              <IntakeWizard onStepTitleChange={setStepTitle} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Public: no sidebar
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <IntakeHeaderPublic title={stepTitle} />
      <div className="flex-1 min-h-0">
        <IntakeWizard onStepTitleChange={setStepTitle} />
      </div>
    </div>
  );
}
