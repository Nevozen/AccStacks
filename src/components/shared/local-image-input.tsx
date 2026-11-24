"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { AccountThumbnail } from "./account-thumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [error, setError] = useState<string | null>(null);

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
    onFile(file);
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="flex items-center gap-3">
        <AccountThumbnail
          key={previewUrl ?? "empty"}
          src={previewUrl}
          alt="Account thumbnail preview"
          className="size-16"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">JPEG, PNG, or WebP · Maximum 3 MB</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Stored privately and only accessible to your workspace.
          </p>
        </div>
        {previewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => {
              setPreviewUrl(null);
              onFile(null);
              onRemove();
            }}
          >
            <Trash2 />
            <span className="sr-only">Remove thumbnail</span>
          </Button>
        ) : null}
      </div>
      <Input
        id="account-image-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => selectFile(event.target.files?.[0])}
        className="h-auto py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-medium"
      />
      <Button type="button" variant="outline" size="sm" asChild disabled={disabled}>
        <label htmlFor="account-image-file">
          <Upload />
          Choose picture
        </label>
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
