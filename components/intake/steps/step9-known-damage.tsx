"use client";
import { useRef, useEffect, useState } from "react";
import { IntakeData } from "../intake-wizard";

type Props = { data: IntakeData; update: (f: Record<string, unknown>) => void };

export function Step9KnownDamage({ data, update }: Props) {
  const v = (k: string) => (data[k] as string) || "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    update({ [k]: e.target.value });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1B2A4A";
    // Draw simple car outline
    drawCar(ctx, canvas.offsetWidth, canvas.offsetHeight);
  }, []);

  const drawCar = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1.5;
    const cx = w / 2, cy = h / 2;
    // Top-down car body
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.15, h * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Windshield
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.2);
    ctx.lineTo(cx + w * 0.1, cy - h * 0.2);
    ctx.stroke();
    // Rear
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy + h * 0.2);
    ctx.lineTo(cx + w * 0.1, cy + h * 0.2);
    ctx.stroke();
    // Side mirrors
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.17, cy - h * 0.1, 8, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.17, cy - h * 0.1, 8, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  return (
    <>
      <div className="ncb-info-banner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10" opacity="0.2"/><text x="10" y="14" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">i</text></svg>
        Please mark any damage you are aware of.
      </div>

      <div className="ncb-card" style={{ marginTop: "1rem" }}>
        <div className="ncb-card-title" style={{ marginBottom: "0.75rem" }}>MARK KNOWN DAMAGE</div>
        <div className="ncb-damage-canvas-wrap">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>

      <div className="ncb-card">
        <div className="ncb-card-title" style={{ marginBottom: "0.75rem" }}>NOTES / PRE-EXISTING DAMAGE NOTES</div>
        <textarea className="ncb-textarea" placeholder="Add any details about the damage marked above..." value={v("damageNotes")} onChange={set("damageNotes")} maxLength={500} />
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>{v("damageNotes").length} / 500</div>
      </div>

      <div className="ncb-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="ncb-initials-input" style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, border: "2px solid #d1d5db", borderRadius: "0.5rem", color: "#1B2A4A" }}>
          {v("clientName")?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", color: "#374151" }}>I confirm that the above markings accurately represent the damage that was present before services.</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Initials</div>
        </div>
        <input className="ncb-initials-input" placeholder="Initials" value={v("damageInitials")} onChange={set("damageInitials")} />
      </div>
    </>
  );
}
