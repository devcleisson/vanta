"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Campaign photography in monochrome. If the remote image can't load
 * (offline demo, blocked CDN), a graphite plate keeps the layout intact.
 */
export function EditorialImage({
  src,
  alt,
  priority,
  sizes = "100vw",
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className={cn("absolute inset-0 bg-graphite", className)}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      // The error can fire before hydration; catch images that already failed.
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0) setFailed(true);
      }}
      className={cn("object-cover grayscale", className)}
    />
  );
}
