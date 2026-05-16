"use client";

import { useState } from "react";
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

export function IntakeWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeData>({});
  const [submitting, setSubmitting] = useState(false);

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
          description: `RO ${data.ro || "—"} has been saved successfully. A PDF will be generated shortly.`,
          duration: 6000,
        });
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
    <>
      <h1 className="ncb-step-title">{STEP_TITLES[step - 1]}</h1>
      <p className="ncb-step-subtitle">Step {step} of 10</p>

      {/* Progress */}
      <div className="ncb-progress">
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

      {renderStep()}

      {/* Footer */}
      <div className="ncb-form-footer">
        {step > 1 && (
          <button className="ncb-btn-back" onClick={back}>
            ← Back
          </button>
        )}
        {step < 10 ? (
          <button className="ncb-btn-continue" onClick={next} style={step === 1 ? { flex: "1 1 100%" } : undefined}>
            Continue →
          </button>
        ) : (
          <button className="ncb-btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Work Order →"}
          </button>
        )}
      </div>
    </>
  );
}

