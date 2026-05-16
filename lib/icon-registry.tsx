/**
 * Dynamic lucide-react icon registry.
 * Exports all available icon names and a component renderer.
 */
import * as LucideIcons from "lucide-react";
import { type LucideProps } from "lucide-react";

// Build list of all icon names (filter out non-component exports and *Icon duplicates)
const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter(
  (key) =>
    /^[A-Z]/.test(key) &&
    !key.endsWith("Icon") &&
    key !== "default" &&
    key !== "createLucideIcon" &&
    typeof (LucideIcons as Record<string, unknown>)[key] === "object"
);

/** First 1000 icons (alphabetical) */
export const ICON_NAMES: string[] = ALL_ICON_NAMES.slice(0, 1000);

/** Total available icons */
export const TOTAL_ICONS = ALL_ICON_NAMES.length;

/**
 * Render a lucide icon by name.
 * Returns null if the icon name is not found.
 */
export function LucideIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const IconComponent = (LucideIcons as Record<string, unknown>)[name] as
    | React.ComponentType<LucideProps>
    | undefined;

  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}

/**
 * Convert PascalCase icon name to readable label.
 * e.g., "AlarmClock" → "Alarm Clock"
 */
export function iconNameToLabel(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default ICON_NAMES;
