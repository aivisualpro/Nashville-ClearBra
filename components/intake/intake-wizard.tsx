"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Undo2, Pencil, FileText, Download, Lock, Loader2 } from "lucide-react";
import { Step1CustomerVehicle } from "./steps/step1-customer-vehicle";
import { Step2ServiceSelection } from "./steps/step2-service-selection";
import { Step3PPF } from "./steps/step3-ppf";
import { Step4WindowTint } from "./steps/step4-window-tint";
import { Step5CeramicWPF } from "./steps/step5-ceramic-wpf";
import { Step6AddOns } from "./steps/step6-addons";
import { Step7JobInstructions } from "./steps/step7-job-instructions";
import { Step8PricingTerms } from "./steps/step8-pricing-terms";
import { Step9KnownDamage } from "./steps/step9-known-damage";
import { Step10Review } from "./steps/step10-review";

export type IntakeData = Record<string, unknown>;

const STEP_TITLES = [
  "Customer + Vehicle Information",
  "Service Selection",
  "Paint Protection Film",
  "Window Tint",
  "Ceramic + WPF",
  "Add-Ons",
  "Job Instructions",
  "Pricing + Terms",
  "Known Damage",
  "Review + Drop-Off Signature",
];

interface IntakeWizardProps {
  onStepTitleChange?: (title: string) => void;
  /** Pre-fill data for viewing/editing an existing job */
  initialData?: IntakeData;
  /** Existing job ID for update mode */
  jobId?: string;
  /** Start in read-only mode */
  readOnly?: boolean;
}

export function IntakeWizard({ onStepTitleChange, initialData, jobId, readOnly: initialReadOnly = false }: IntakeWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeData>(initialData || {});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const isEditMode = !!jobId;

  useEffect(() => {
    onStepTitleChange?.(STEP_TITLES[step - 1]);
  }, [step, onStepTitleChange]);

  // Poll for PDF status after save
  const pdfStatus = data.jobOrderPdf as string | undefined;
  const isPdfGenerating = pdfStatus === "generating";
  const hasPdf = !!pdfStatus && pdfStatus !== "generating";
  const pollRef = useRef(false);

  useEffect(() => {
    if (!isPdfGenerating || !jobId) return;
    pollRef.current = true;
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 20 || !pollRef.current) { clearInterval(interval); return; }
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const url = json.data.jobOrderPdf;
          if (url && url !== "generating") {
            setData((prev) => ({ ...prev, jobOrderPdf: url }));
            clearInterval(interval);
          }
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => { pollRef.current = false; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPdfGenerating, jobId]);

  const update = (fields: Record<string, unknown>) => {
    if (readOnly) return; // block updates in read-only
    setData((prev) => ({ ...prev, ...fields }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 10));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Auto-generate damage diagram if there are pins
      const pins = (data.damagePins as Array<{ id: string }> | undefined) || [];
      let submitData = { ...data };
      if (pins.length > 0) {
        try {
          const subtitle = [
            String(data.clientName || ""),
            [data.vYear, data.vMake, data.vModel].filter(Boolean).join(" "),
            data.ro ? `RO ${data.ro}` : "",
          ].filter(Boolean).join(" · ");

          const { generateDamageDiagram } = await import("@/lib/damage-diagram");
          const blob = await generateDamageDiagram({
            pins: data.damagePins as any,
            bodyStyle: (data.bodyStyle as "sedan" | "suv") || "sedan",
            subtitle,
          });

          const formData = new FormData();
          formData.append("file", new File([blob], `damage-${data.ro || Date.now()}.png`, { type: "image/png" }));
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadJson = await uploadRes.json();
          if (uploadJson.success && uploadJson.url) {
            submitData = {
              ...submitData,
              damageDiagramUrl: uploadJson.url,
              damageDiagramGeneratedAt: new Date().toISOString(),
            };
          }
        } catch (err) {
          console.warn("[Damage Diagram] Failed to auto-generate:", err);
          // Continue with save — diagram is optional
        }
      }

      const url = isEditMode ? `/api/jobs/${jobId}` : "/api/intake";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(isEditMode ? "Work Order Updated" : "Work Order Submitted", {
          description: `RO ${data.ro || "—"} has been saved successfully.${result.changes ? ` ${result.changes} field(s) updated.` : ""} PDF is being generated...`,
          duration: 6000,
        });
        setSubmitted(true);
        // Set jobOrderPdf to "generating" so the PDF icon starts polling
        setData((prev) => ({ ...prev, ...submitData, jobOrderPdf: "generating" }));
        if (isEditMode) {
          setReadOnly(true);
        }
      } else {
        toast.error("Submission Failed", {
          description: result.error || result.message || "Could not save work order. Please try again.",
          duration: 5000,
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Could not connect to the server. Please check your connection.",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generatePdf = async () => {
    setGeneratingPdf(true);
    try {
      const pdfRes = await fetch("/api/intake/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")) {
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch {
      toast.error("PDF generation failed. You can retry.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1CustomerVehicle data={data} update={update} />;
      case 2: return <Step2ServiceSelection data={data} update={update} />;
      case 3: return <Step3PPF data={data} update={update} />;
      case 4: return <Step4WindowTint data={data} update={update} />;
      case 5: return <Step5CeramicWPF data={data} update={update} />;
      case 6: return <Step6AddOns data={data} update={update} />;
      case 7: return <Step7JobInstructions data={data} update={update} />;
      case 8: return <Step8PricingTerms data={data} update={update} />;
      case 9: return <Step9KnownDamage data={data} update={update} />;
      case 10: return <Step10Review data={data} update={update} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky progress + nav */}
      <div className="sticky top-0 z-30 bg-background border-b py-3 px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Far left: Back to Jobs */}
          <button
            onClick={() => router.push("/jobs")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", fontSize: "0.78rem", fontWeight: 600,
              padding: "0.3rem 0.5rem", borderRadius: 6, flexShrink: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <Undo2 style={{ width: 13, height: 13 }} />
            Back
          </button>

          {/* Previous */}
          <button
            className="ncb-btn-back"
            onClick={back}
            disabled={step === 1}
            style={{ visibility: step === 1 ? "hidden" : "visible", minWidth: 90 }}
          >
            ← Previous
          </button>

          {/* Center: Step circles */}
          <div className="ncb-progress" style={{ flex: "1 1 auto", justifyContent: "center" }}>
            {Array.from({ length: 10 }, (_, i) => {
              const n = i + 1;
              return (
                <div key={n} className="ncb-progress-step">
                  {i > 0 && (
                    <div className={`ncb-progress-line ${n <= step ? "ncb-progress-line--done" : ""}`} />
                  )}
                  <div
                    className={`ncb-progress-circle ${
                      n === step ? "ncb-progress-circle--active" : n < step ? "ncb-progress-circle--done" : ""
                    }`}
                    onClick={() => setStep(n)}
                    style={{ cursor: "pointer" }}
                  >
                    {n}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next / Save Changes */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 90 }}>
            {step < 10 ? (
              <>
                <button className="ncb-btn-continue" onClick={next} style={{ minWidth: 90 }}>
                  Next →
                </button>
                {isEditMode && !readOnly && (
                  <button
                    className="ncb-btn-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ minWidth: 80, fontSize: "0.78rem" }}
                  >
                    {submitting ? "Saving…" : "Save"}
                  </button>
                )}
              </>
            ) : !readOnly ? (
              submitted ? (
                generatingPdf ? (
                  <button className="ncb-btn-submit" disabled style={{ minWidth: 120, opacity: 0.7 }}>
                    <span className="ncb-spinner-inline" /> Saving…
                  </button>
                ) : pdfUrl ? (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ncb-btn-continue" style={{ minWidth: 120, textDecoration: "none", textAlign: "center" }}>
                    <Download className="size-3.5" /> Download PDF
                  </a>
                ) : (
                  <button className="ncb-btn-continue" onClick={() => generatePdf()} style={{ minWidth: 120 }}>
                    <FileText className="size-3.5" /> Generate PDF
                  </button>
                )
              ) : (
                <button className="ncb-btn-submit" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 90 }}>
                  {submitting ? "Saving..." : isEditMode ? "Save Changes →" : "Submit →"}
                </button>
              )
            ) : (
              <div style={{ minWidth: 90 }} />
            )}
          </div>

          {/* Right: Action icons (PDF + Edit) */}
          {isEditMode && (
            <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
              {/* PDF icon — only in view mode, spinner while generating */}
              {readOnly && (
              <button
                type="button"
                title={isPdfGenerating ? "Generating PDF…" : hasPdf ? "View PDF" : "PDF not available"}
                className="ncb-action-btn"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${isPdfGenerating ? "#E77000" : "#d1d5db"}`,
                  background: "#fff",
                  opacity: isPdfGenerating || hasPdf ? 1 : 0.4,
                  cursor: hasPdf ? "pointer" : "default",
                }}
                onClick={() => {
                  if (hasPdf) {
                    window.open(pdfStatus!, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                {isPdfGenerating
                  ? <Loader2 className="size-4 animate-spin" style={{ color: "#E77000" }} />
                  : <FileText className="size-4" style={{ color: "#E77000" }} />
                }
              </button>
              )}

              {/* Edit icon */}
              {readOnly && (
                <button
                  type="button"
                  title="Edit this work order"
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1.5px solid #E77000", background: "#E77000",
                    cursor: "pointer",
                  }}
                  onClick={() => { setReadOnly(false); setSubmitted(false); }}
                >
                  <Pencil className="size-4" style={{ color: "#fff" }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      {readOnly && (
        <div style={{
          background: "#fef3cd", borderBottom: "1px solid #ffc107",
          padding: "6px 16px", fontSize: "0.8rem", color: "#856404",
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        }}>
          <Lock className="size-3.5" /> Viewing in read-only mode. Click <strong>Edit</strong> to make changes.
        </div>
      )}

      {/* Scrollable step content */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ${readOnly ? "opacity-80 select-none" : ""}`} style={readOnly ? { pointerEvents: "auto" } : undefined}>
        {renderStep()}
      </div>
    </div>
  );
}
