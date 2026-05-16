"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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

export function IntakeWizard({ onStepTitleChange }: { onStepTitleChange?: (title: string) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeData>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    onStepTitleChange?.(STEP_TITLES[step - 1]);
  }, [step, onStepTitleChange]);

  const update = (fields: Record<string, unknown>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 10));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Work Order Submitted", {
          description: `RO ${data.ro || "—"} has been saved successfully.`,
          duration: 6000,
        });
        setSubmitted(true);
        // Trigger PDF generation
        setGeneratingPdf(true);
        try {
          const pdfRes = await fetch("/api/intake/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: result.id, ...data }),
          });
          const pdfResult = await pdfRes.json();
          if (pdfRes.ok && pdfResult.url) {
            setPdfUrl(pdfResult.url);
          }
        } catch {
          // PDF generation can fail silently — user can retry
        } finally {
          setGeneratingPdf(false);
        }
      } else {
        toast.error("Submission Failed", {
          description: result.error || "Could not save work order. Please try again.",
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
                    onClick={() => n < step && setStep(n)}
                    style={{ cursor: n < step ? "pointer" : "default" }}
                  >
                    {n}
                  </div>
                </div>
              );
            })}
          </div>

          {step < 10 ? (
            <button className="ncb-btn-continue" onClick={next} style={{ minWidth: 90 }}>
              Next →
            </button>
          ) : submitted ? (
            generatingPdf ? (
              <button className="ncb-btn-submit" disabled style={{ minWidth: 120, opacity: 0.7 }}>
                <span className="ncb-spinner-inline" /> Generating PDF…
              </button>
            ) : pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ncb-btn-continue" style={{ minWidth: 120, textDecoration: "none", textAlign: "center" }}>
                📄 Download PDF
              </a>
            ) : (
              <button className="ncb-btn-continue" onClick={() => { setGeneratingPdf(true); handleSubmit(); }} style={{ minWidth: 120 }}>
                📄 Generate PDF
              </button>
            )
          ) : (
            <button className="ncb-btn-submit" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 90 }}>
              {submitting ? "Submitting..." : "Submit →"}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {renderStep()}
      </div>
    </div>
  );
}

