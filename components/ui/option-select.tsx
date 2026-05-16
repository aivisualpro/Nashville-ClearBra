"use client";

import * as React from "react";
import { LucideIcon } from "@/lib/icon-registry";

export type OptionEntry = {
  _id: string;
  value: string;
  color: string;
  icon: string;
};

type Props = {
  /** The name of the option set in Nashville_Options (e.g. "Lead Source") */
  optionSetName: string;
  /** Currently selected ObjectId */
  value: string;
  /** Called with { _id, value, color, icon } of selected option */
  onSelect: (option: OptionEntry | null) => void;
  placeholder?: string;
  className?: string;
};

export function OptionSelect({
  optionSetName,
  value,
  onSelect,
  placeholder = "Select…",
  className = "",
}: Props) {
  const [options, setOptions] = React.useState<OptionEntry[]>([]);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  // Fetch options from API
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/options");
        const json = await res.json();
        if (!cancelled && json.success) {
          const set = json.data.find(
            (d: { name: string }) => d.name === optionSetName
          );
          if (set?.options) {
            setOptions(
              set.options.map((o: OptionEntry) => ({
                _id: o._id?.toString() || "",
                value: o.value || "",
                color: o.color || "",
                icon: o.icon || "",
              }))
            );
          }
        }
      } catch {
        /* silently fail */
      }
    })();
    return () => { cancelled = true; };
  }, [optionSetName]);

  // Close on outside click/touch
  React.useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const selected = options.find((o) => o._id === value);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.value.toLowerCase().includes(q));
  }, [options, search]);

  /** Generate contrasting text color (white or dark) for a given bg hex */
  const textColor = (hex: string) => {
    if (!hex) return undefined;
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#1a1a1a" : "#ffffff";
  };

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [dropStyle, setDropStyle] = React.useState<React.CSSProperties>({});

  // Recalculate position when opening
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropUp = spaceBelow < 260;
      setDropStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 280),
        ...(dropUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      });
    }
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="ncb-select flex items-center gap-2 w-full text-left"
        onClick={(e) => { e.preventDefault(); setOpen(!open); setSearch(""); }}
        onTouchEnd={(e) => { e.preventDefault(); setOpen(!open); setSearch(""); }}
      >
        {selected ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: selected.color || "#e5e7eb",
              color: textColor(selected.color || "#e5e7eb"),
            }}
          >
            {selected.icon && (
              <LucideIcon name={selected.icon} className="size-3.5" />
            )}
            {selected.value}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={dropStyle}
          className="bg-popover border rounded-lg shadow-xl overflow-hidden"
        >          {/* Search */}
          <div className="p-1.5 border-b">
            <input
              type="text"
              className="w-full text-sm px-2 py-1 rounded border bg-background outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {/* Chips grid */}
          <div className="overflow-y-auto max-h-[220px] p-2">
            {/* Clear option */}
            {value && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground mb-2 underline"
                onClick={() => { onSelect(null); setOpen(false); }}
              >
                ✕ Clear selection
              </button>
            )}
            {filtered.length === 0 && (
              <div className="py-3 text-sm text-muted-foreground text-center">
                No options found
              </div>
            )}
            <div className="flex flex-col items-start gap-1">
              {filtered.map((opt) => (
                <button
                  key={opt._id}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110 ${
                    opt._id === value ? "ring-2 ring-offset-1 ring-primary" : ""
                  }`}
                  style={{
                    backgroundColor: opt.color || "#e5e7eb",
                    color: textColor(opt.color || "#e5e7eb"),
                  }}
                  onClick={() => { onSelect(opt); setOpen(false); }}
                >
                  {opt.icon && (
                    <LucideIcon name={opt.icon} className="size-3.5" />
                  )}
                  {opt.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

