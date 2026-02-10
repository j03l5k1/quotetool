"use client";

import { useRef, useState } from "react";

type Props = {
  quoteId: string; // your internal quote id / public id etc
  onUploaded?: (uploadId: string) => void;
};

export default function VideoUploadCard({ quoteId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  async function pickFile() {
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      setProgress(0);
      setStatus("Creating upload…");

      // 1) Ask your API for a Mux direct upload URL
      const res = await fetch("/api/mux/create-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: quoteId }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { uploadUrl, uploadId } = await res.json();

      setStatus("Uploading video…");

      // 2) Upload to Mux (PUT to uploadUrl)
      // Use XHR so we can show progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Upload failed (network)"));
        xhr.send(file);
      });

      setStatus("Uploaded. Processing… (may take a minute)");
      onUploaded?.(uploadId);

      // Optional: you being fancy later:
      // - poll your DB for playbackId to flip status to “Ready”
      // For now, webhook will populate it and viewer will show when ready.
    } catch (err: any) {
      setStatus(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{
      borderRadius: 16,
      padding: 16,
      border: "1px solid rgba(255,255,255,.08)",
      background: "rgba(255,255,255,.03)",
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>CCTV Video</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Upload the drain footage for this job (phone gallery supported).
          </div>
        </div>

        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,255,.25)",
            background: busy ? "rgba(255,255,255,.06)" : "rgba(0,255,255,.12)",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {busy ? "Uploading…" : "Upload CCTV Video"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>

      {!!status && (
        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          {status}
          {progress > 0 && progress < 100 && (
            <span> — {progress}%</span>
          )}
        </div>
      )}
    </div>
  );
}
