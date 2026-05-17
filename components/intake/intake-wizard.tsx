"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Pencil, FileText, Download, Lock } from "lucide-react";
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
        <div className="flex items-center gap-3 justify-center">
          <button
            className="ncb-btn-back"
            onClick={back}
            disabled={step === 1}
            style={{ visibility: step === 1 ? "hidden" : "visible", minWidth: 90 }}
          >
            ← Previous
          </button>

          <div className="ncb-progress" style={{ flex: "0 1 auto" }}>
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

          <div className="flex items-center gap-2" style={{ minWidth: 200, justifyContent: "flex-end" }}>
            {/* Read-only toggle for edit mode */}
            {isEditMode && readOnly && (
              <button
                className="ncb-btn-continue"
                onClick={() => { setReadOnly(false); setSubmitted(false); }}
                style={{ minWidth: 90 }}
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            )}

            {/* Navigation / Submit */}
            {step < 10 ? (
              <button className="ncb-btn-continue" onClick={next} style={{ minWidth: 90 }}>
                Next →
              </button>
            ) : !readOnly && (
              submitted ? (
                generatingPdf ? (
                  <button className="ncb-btn-submit" disabled style={{ minWidth: 120, opacity: 0.7 }}>
                    <span className="ncb-spinner-inline" /> Generating PDF…
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
            )}
          </div>
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
      <div className={`flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ${readOnly ? "pointer-events-none opacity-80" : ""}`}>
        {renderStep()}
      </div>
    </div>
  );
}
