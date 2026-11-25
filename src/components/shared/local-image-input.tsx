"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { AccountThumbnail } from "./account-thumbnail";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_BYTES } from "@/lib/image-files";

export function LocalImageInput({
  existingUrl,
  disabled,
  onFile,
  onRemove,
}: {
  existingUrl: string | null;
  disabled?: boolean;
  onFile: (file: File | null) => void;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function selectFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be at most 3 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(file);
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <AccountThumbnail
          key={previewUrl ?? "empty"}
          src={previewUrl}
          alt="Account thumbnail preview"
          className="size-11"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium" title={fileName ?? undefined}>
            {fileName ?? (previewUrl ? "Current picture" : "No picture selected")}
          </p>
          <p id="account-image-help" className="mt-0.5 text-xs text-muted-foreground">
            Private image. JPEG, PNG, or WebP up to 3 MB.
          </p>
        </div>
        <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-describedby={error ? "account-image-error" : "account-image-help"}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden="true" />
            {previewUrl ? "Replace picture" : "Choose picture"}
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => {
                setPreviewUrl(null);
                setFileName(null);
                setError(null);
                onFile(null);
                onRemove();
              }}
            >
              <Trash2 aria-hidden="true" />
              <span className="sr-only">Remove thumbnail</span>
            </Button>
          ) : null}
        </div>
      </div>
      <input
        id="account-image-file"
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        aria-label="Account thumbnail file"
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        hidden
      />
      {error ? (
        <p id="account-image-error" className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
