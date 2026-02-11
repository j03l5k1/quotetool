"use client";

import React, { useRef, useState } from "react";

type Props = {
  /** MUST be the ServiceM8 job uuid (stable identifier across quote lifecycle) */
  jobUuid: string;

  /** optional callback if you want to store uploadId/jobMediaId in your quote tool UI */
  onCreated?: (info: { uploadId: string; jobMediaId?: string }) => void;

  /** optional max size in MB (defaults 500) */
  maxSizeMb?: number;
};

type Status =
  | ""
  | "creating"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export default function VideoUploadCard({
  jobUuid,
  onCreated,
  maxSizeMb = 500,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>("");
  const [message, setMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const pickFile = () => inputRef.current?.click();

  async function createUpload() {
    const res = await fetch("/api/mux/create-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_uuid: jobUuid }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `create-upload failed (${res.status})`);
    }

    // expected (viewer): { ok:true, uploadUrl, uploadId, jobMediaId? }
    const json = (await res.json()) as any;

    // Be tolerant in case your proxy returns a slightly different shape
    const uploadUrl = json.uploadUrl || json.upload_url;
    const uploadId = json.uploadId || json.upload_id;
    const jobMediaId = json.jobMediaId || json.job_media_id;

    if (!uploadUrl || !uploadId) {
      throw new Error("create-upload returned invalid payload (missing uploadUrl/uploadId)");
    }

    return { uploadUrl: String(uploadUrl), uploadId: String(uploadId), jobMediaId };
  }

  function putFile(uploadUrl: string, file: File) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream"
      );

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };

      xhr.onerror = () => reject(new Error("Upload failed (network error)"));
      xhr.send(file);
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // reset
    setProgress(0);
    setMessage("");

    // quick guard — jobUuid must exist
    if (!jobUuid) {
      setStatus("error");
      setMessage("Missing job UUID. Load the job first, then upload.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // size guard
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setStatus("error");
      setMessage(`Video too large. Please keep under ${maxSizeMb}MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      setBusy(true);

      setStatus("creating");
      setMessage("Creating secure upload…");
      const { uploadUrl, uploadId, jobMediaId } = await createUpload();
      onCreated?.({ uploadId, jobMediaId });

      setStatus("uploading");
      setMessage("Uploading CCTV video…");
      await putFile(uploadUrl, file);

      setStatus("processing");
      setMessage("Uploaded. Processing… (will appear in the quote viewer shortly)");

      // NOTE:
      // We do NOT mark "done" here, because Mux processing completes async.
      // The quote viewer should poll /api/job-media?job_uuid=... and swap in the player when ready.
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 240 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>CCTV Video</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>
            Upload the drain footage for this job (phone gallery supported).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={pickFile}
            disabled={busy || !jobUuid}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,255,255,.25)",
              background:
                busy || !jobUuid
                  ? "rgba(255,255,255,.06)"
                  : "rgba(0,255,255,.12)",
              cursor: busy || !jobUuid ? "not-allowed" : "pointer",
              fontWeight: 800,
              opacity: !jobUuid ? 0.7 : 1,
            }}
            title={!jobUuid ? "Load job first" : undefined}
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
      </div>

      {(message || status) && (
        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
          {status === "uploading" && progress > 0 && progress < 100
            ? `${message} — ${progress}%`
            : message}
        </div>
      )}
    </div>
  );
}
