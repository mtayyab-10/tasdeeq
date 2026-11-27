"use client";
import { useRef, useState } from "react";

interface Props {
  onImageSelect: (base64: string, mime: string, preview: string) => void;
  preview: string | null;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 19;

export default function Uploader({ onImageSelect, preview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const process = (file: File) => {
    setErr(null);
    if (!ACCEPTED.includes(file.type)) {
      setErr("Please upload a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Image must be under ${MAX_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      onImageSelect(base64, file.type, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) process(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) process(file);
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        id="upload-zone"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload document image"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Document preview" className="upload-zone__preview" />
        ) : (
          <>
            <div className="upload-zone__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pk-navy)", opacity: 0.7 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="upload-zone__text">
              Drop your bill, invoice or ledger photo here
            </div>
            <div className="upload-zone__hint">
              JPEG · PNG · WebP · up to 19 MB · English or Urdu labels supported
            </div>
            <div className="upload-zone__cta">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--accent-dim)", color: "var(--pk-navy)", padding: "6px 14px", borderRadius: "var(--r-md)", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose File or Click Here
              </span>
            </div>
          </>
        )}
      </div>
      {err && <div className="alert alert--error" style={{ marginTop: "8px" }}><span>⚠</span><span>{err}</span></div>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        style={{ display: "none" }}
        onChange={onChange}
        id="file-input"
      />
    </div>
  );
}
