"use client";

import * as React from "react";
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Camera, Video, Maximize2 } from "lucide-react";
import { createPortal } from "react-dom";

type MediaItem = string; // Cloudinary URL

interface MediaSectionProps {
  items: MediaItem[];
  jobId: string;
  fieldKey: string;          // e.g. "inspectionPhotos"
  mediaType: "image" | "video";
  accept: string;            // e.g. "image/*" or "video/*"
}

export function MediaSection({ items, jobId, fieldKey, mediaType, accept }: MediaSectionProps) {
  const [urls, setUrls] = React.useState<MediaItem[]>(items);
  const [uploading, setUploading] = React.useState(false);
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync with parent
  React.useEffect(() => { setUrls(items); }, [items]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mediaType", mediaType);
        formData.append("folder", `nashville_jobs/${jobId}/${fieldKey}`);

        const res = await fetch("/api/upload-media", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success && json.url) {
          newUrls.push(json.url);
        }
      } catch { /* skip failed */ }
    }

    if (newUrls.length > 0) {
      const updated = [...urls, ...newUrls];
      setUrls(updated);

      // Persist to job document
      try {
        await fetch(`/api/jobs/${jobId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [fieldKey]: updated }),
        });
      } catch { /* silent */ }
    }
    setUploading(false);
  };

  const handleRemove = async (index: number) => {
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldKey]: updated }),
      });
    } catch { /* silent */ }
  };

  const isVideo = mediaType === "video";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 6 }}>
      {/* Upload button */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "0.4rem",
          border: "1.5px dashed #d1d5db", borderRadius: 8,
          background: uploading ? "#f8fafc" : "#fff",
          cursor: uploading ? "wait" : "pointer",
          color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600,
          transition: "all 0.15s", flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = "#E77000"; e.currentTarget.style.color = "#E77000"; }}}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#94a3b8"; }}
      >
        {uploading ? (
          <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Uploading…</>
        ) : (
          <><Plus style={{ width: 13, height: 13 }} /> {isVideo ? <Video style={{ width: 13, height: 13 }} /> : <Camera style={{ width: 13, height: 13 }} />} Add</>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Media grid / carousel */}
      {urls.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#e2e8f0", fontSize: "0.72rem",
        }}>
          No {isVideo ? "videos" : "photos"} yet
        </div>
      ) : (
        <div style={{
          flex: 1, overflowY: "auto",
          display: "grid",
          gridTemplateColumns: isVideo ? "1fr" : "repeat(auto-fill, minmax(70px, 1fr))",
          gap: 6,
        }}>
          {urls.map((url, i) => (
            <div key={i} style={{
              position: "relative", borderRadius: 8, overflow: "hidden",
              border: "1px solid #e2e8f0", background: "#000",
              aspectRatio: isVideo ? "16/9" : "1",
              cursor: "pointer",
            }}
            onClick={() => setLightboxIdx(i)}
            >
              {isVideo ? (
                <video
                  src={url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}

              {/* Expand icon */}
              <div style={{
                position: "absolute", bottom: 3, right: 3,
                background: "rgba(0,0,0,0.5)", borderRadius: 4,
                padding: 2, display: "flex",
              }}>
                <Maximize2 style={{ width: 10, height: 10, color: "#fff" }} />
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                style={{
                  position: "absolute", top: 3, right: 3,
                  background: "rgba(0,0,0,0.6)", border: "none",
                  borderRadius: "50%", width: 18, height: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                }}
              >
                <X style={{ width: 10, height: 10 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: "50%", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", zIndex: 2,
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>

          {/* Prev */}
          {urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p! - 1 + urls.length) % urls.length); }}
              style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: "50%", width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff", zIndex: 2,
              }}
            >
              <ChevronLeft style={{ width: 22, height: 22 }} />
            </button>
          )}

          {/* Media */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "85vw", maxHeight: "85vh" }}>
            {isVideo ? (
              <video
                src={urls[lightboxIdx]}
                controls
                autoPlay
                style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 8 }}
              />
            ) : (
              <img
                src={urls[lightboxIdx]}
                alt=""
                style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 8, objectFit: "contain" }}
              />
            )}
          </div>

          {/* Next */}
          {urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p! + 1) % urls.length); }}
              style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: "50%", width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff", zIndex: 2,
              }}
            >
              <ChevronRight style={{ width: 22, height: 22 }} />
            </button>
          )}

          {/* Counter */}
          <div style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.6)", borderRadius: 20,
            padding: "4px 14px", color: "#fff", fontSize: "0.78rem", fontWeight: 600,
          }}>
            {lightboxIdx + 1} / {urls.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
