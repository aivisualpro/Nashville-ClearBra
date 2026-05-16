export interface DamagePin {
  id: string;
  position: [number, number, number];
  normal: [number, number, number];
  type: "scratch" | "dent" | "paint_chip" | "broken" | "glass" | "other";
  severity: "minor" | "moderate" | "severe";
  notes: string;
}
