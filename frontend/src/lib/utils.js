import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Coerce an API payload into an array of rows.
 *
 * The API is inconsistent: some endpoints return `data` as a plain array, and
 * the paginated ones return `data: { results, count }`. Reading `data.data`
 * directly therefore yields an object about half the time, and the next
 * `.map()` throws. Route every list through here.
 *
 *   toList(json.data)  // works for both shapes
 */
export function toList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}
