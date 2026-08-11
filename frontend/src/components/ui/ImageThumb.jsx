"use client";

import { useState } from "react";
import { ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small image cell with click-to-enlarge. Replaces antd's <Image>, and unlike
 * the old placeholder it degrades to an icon instead of hotlinking a dead
 * placeholder service when `src` is missing or 404s.
 */
export default function ImageThumb({
  src,
  alt = "",
  size = 36,
  rounded = "rounded-md",
  className,
  previewable = true,
}) {
  const [broken, setBroken] = useState(false);
  const [preview, setPreview] = useState(false);

  const box = { width: size, height: size };

  if (!src || broken) {
    return (
      <div
        style={box}
        title={alt}
        className={cn(
          "flex items-center justify-center bg-ink-100 text-ink-400 shrink-0",
          rounded,
          className,
        )}
      >
        <ImageOff className="size-3.5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        style={box}
        loading="lazy"
        onError={() => setBroken(true)}
        onClick={previewable ? () => setPreview(true) : undefined}
        className={cn(
          "object-cover shrink-0 border border-ink-200",
          rounded,
          previewable && "cursor-zoom-in hover:opacity-90 transition-opacity",
          className,
        )}
      />

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image preview"}
          onClick={() => setPreview(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/80 p-6 animate-fade-in cursor-zoom-out"
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setPreview(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-3xl rounded-xl object-contain shadow-pop animate-pop-in"
          />
        </div>
      )}
    </>
  );
}
