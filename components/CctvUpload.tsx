"use client";

import { useRef, useState } from "react";

type Props = {
  viewerBaseUrl: string;     // e.g. https://civiro-quotes.vercel.app
  viewerIntakeSecret: string; // store in env on quote tool
  publicId: string;          // the quote public_id
};

export default function CctvUpload({ viewerBaseUrl, viewerIntakeSecret, publicId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState<number>(0);

  async function createUpload() {
    const res = await fetch(`${viewerBaseUrl}/api/mux/create-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${viewerIntakeSecret}`,
      },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!res.ok) throw new Error(`create-upload failed (${res.status})`);
    return res.json() as Promise<{ ok: true; uploadUrl: string; uploadId: string }>;
  }

  function putFile(uploadUrl: string, file: File) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("upload failed (network error)"));
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);
    });
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    setProgress(0);

    try {
      setStatus("creating_upload");
      const { uploadUrl } = await createUpload();

      setStatus("uploading");
      await putFile(uploadUrl, file);

      setStatus("processing");
      // Done. Webhook will update the quote row and viewer will show it automatically.
    } catch (e: any) {
      setStatus(`error: ${e?.message || "unknown"}`);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-xl px-4 py-2 font-medium border bg-white"
      >
        Upload CCTV video
      </button>

      <div className="mt-2 text-sm opacity-80">
        {status === "uploading" ? `Uploading… ${progress}%` : status === "processing" ? "Processing… (will appear in quote automatically)" : status}
      </div>
    </div>
  );
}
