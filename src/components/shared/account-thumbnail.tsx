"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountThumbnail({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
        className,
      )}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="96px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
