import "@/app/intake.css";
import { IntakeWizard } from "@/components/intake/intake-wizard";

export default function IntakePage() {
  return (
    <div className="ncb-intake-page">
      <header className="ncb-intake-header">
        <div className="ncb-intake-logo">
          NASHVILLE <span>CLEARBRA</span>
        </div>
      </header>
      <div className="ncb-intake-body">
        <IntakeWizard />
      </div>
    </div>
  );
}
