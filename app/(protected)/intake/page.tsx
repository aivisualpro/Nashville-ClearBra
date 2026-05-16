"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { IntakeWizard } from "@/components/intake/intake-wizard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconLayoutSidebar } from "@tabler/icons-react";

function IntakeHeader({ title }: { title: string }) {
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
        <IconLayoutSidebar className="size-4" />
      </Button>
      <h1 className="flex-1 text-center text-xl font-bold tracking-wide" style={{ color: "#E8601C" }}>
        {title}
      </h1>
      {/* Invisible spacer to balance the toggle button */}
      <div className="size-7 shrink-0" />
    </div>
  );
}

export default function IntakePage() {
  const [stepTitle, setStepTitle] = useState("Customer + Vehicle Information");

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <IntakeHeader title={stepTitle} />
            <div className="flex flex-col gap-4 py-2 px-4 md:gap-6 md:py-4 lg:px-6">
              <IntakeWizard onStepTitleChange={setStepTitle} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
