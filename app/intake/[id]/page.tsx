"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { IntakeWizard, IntakeData } from "@/components/intake/intake-wizard";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

function IntakeHeaderAuth({ title }: { title: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center px-4 lg:px-6 py-3">
      <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft className="size-4" />
      </Button>
      <h1 className="flex-1 text-center text-xl font-bold tracking-wide" style={{ color: "#E77000" }}>{title}</h1>
      <div className="size-7 shrink-0" />
    </div>
  );
}

function IntakeHeaderPublic({ title }: { title: string }) {
  return (
    <div className="flex items-center px-4 lg:px-6 py-3">
      <h1 className="flex-1 text-center text-xl font-bold tracking-wide" style={{ color: "#E77000" }}>{title}</h1>
    </div>
  );
}

/** Centered loading / error content */
function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      {children}
    </div>
  );
}

export default function IntakeJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // "edit" or null (default = view)
  const [stepTitle, setStepTitle] = useState("Customer + Vehicle Information");
  const [jobData, setJobData] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuth = status === "authenticated" && !!session;

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const result = await res.json();
        if (result.success) {
          setJobData(result.data);
        } else {
          setError(result.message || "Job not found");
        }
      } catch {
        setError("Failed to load job data");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  // Build the inner content based on loading/error/loaded state
  let innerContent: React.ReactNode;
  if (loading) {
    innerContent = (
      <CenteredMessage>
        <div className="flex flex-col items-center gap-3">
          <div className="ncb-spinner" />
          <span className="text-sm text-muted-foreground">Loading work order…</span>
        </div>
      </CenteredMessage>
    );
  } else if (error || !jobData) {
    innerContent = (
      <CenteredMessage>
        <div className="text-center">
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚠️</div>
          <div className="text-sm text-muted-foreground">{error || "Job not found"}</div>
        </div>
      </CenteredMessage>
    );
  } else {
    innerContent = (
      <IntakeWizard
        onStepTitleChange={setStepTitle}
        initialData={jobData}
        jobId={id}
        readOnly={mode !== "edit"}
      />
    );
  }

  // Authenticated layout — always render the sidebar shell
  if (isAuth) {
    return (
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 52)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="intake-layout flex flex-col h-full overflow-hidden">
            <IntakeHeaderAuth title={stepTitle} />
            <div className="flex-1 min-h-0">
              {innerContent}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Public layout
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <IntakeHeaderPublic title={stepTitle} />
      <div className="flex-1 min-h-0">
        {innerContent}
      </div>
    </div>
  );
}

