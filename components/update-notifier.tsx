"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_HASH } from "@/lib/version";
import { RefreshCw } from "lucide-react";

const POLL_INTERVAL = 60_000; // check every 60 seconds

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const localHash = useRef(BUILD_HASH);

  useEffect(() => {
    // Don't poll in dev
    if (localHash.current === "dev") return;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { hash } = await res.json();
        if (hash && hash !== localHash.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // silently ignore
      }
    };

    const interval = setInterval(check, POLL_INTERVAL);
    // First check after 10s to avoid startup noise
    const timeout = setTimeout(check, 10_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#1B2A4A",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontSize: "0.85rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <RefreshCw className="size-4" />
      <span>A new version is available</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#E8601C",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Update Now
      </button>
      <button
        onClick={() => setUpdateAvailable(false)}
        style={{
          background: "transparent",
          color: "#9ca3af",
          border: "none",
          fontSize: "1rem",
          cursor: "pointer",
          padding: "0 4px",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
