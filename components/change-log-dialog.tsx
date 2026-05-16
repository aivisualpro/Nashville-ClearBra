"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Inbox } from "lucide-react";

interface ChangeLogEntry {
  userId: string | null;
  timestamp: string;
  field: string;
  from: unknown;
  to: unknown;
}

interface ChangeLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: ChangeLogEntry[];
  roNumber?: string;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function formatField(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ChangeLogDialog({ open, onOpenChange, logs, roNumber }: ChangeLogDialogProps) {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Change History
            {roNumber && (
              <span className="text-muted-foreground text-sm font-normal ml-2">
                RO: {roNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Inbox className="size-8" style={{ opacity: 0.4 }} />
            <p className="text-sm text-muted-foreground">No changes recorded yet</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-4 top-2 bottom-2 w-px"
                style={{ background: "linear-gradient(to bottom, #E8601C, #1B2A4A)" }}
              />

              <div className="flex flex-col gap-0">
                {sorted.map((log, i) => (
                  <div key={i} className="relative pl-10 py-3 group">
                    {/* Dot */}
                    <div
                      className="absolute left-[11px] top-[18px] w-[10px] h-[10px] rounded-full border-2"
                      style={{
                        borderColor: "#E8601C",
                        background: i === 0 ? "#E8601C" : "#fff",
                      }}
                    />

                    {/* Card */}
                    <div
                      className="rounded-lg border p-3 transition-all group-hover:shadow-sm"
                      style={{
                        background: i === 0 ? "rgba(232, 96, 28, 0.03)" : undefined,
                        borderColor: i === 0 ? "rgba(232, 96, 28, 0.2)" : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            background: "#1B2A4A",
                            color: "#fff",
                          }}
                        >
                          {formatField(log.field)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span title={new Date(log.timestamp).toLocaleString()}>
                            {timeAgo(log.timestamp)}
                          </span>
                          <span className="tabular-nums">
                            {new Date(log.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: "#ef4444" }}
                            />
                            <span className="text-muted-foreground text-xs">From:</span>
                            <span className="truncate font-mono text-xs" title={formatValue(log.from)}>
                              {formatValue(log.from)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: "#22c55e" }}
                            />
                            <span className="text-muted-foreground text-xs">To:</span>
                            <span className="truncate font-mono text-xs font-medium" title={formatValue(log.to)}>
                              {formatValue(log.to)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t mt-2 text-xs text-muted-foreground text-center">
          {sorted.length} change{sorted.length !== 1 ? "s" : ""} recorded
        </div>
      </DialogContent>
    </Dialog>
  );
}
