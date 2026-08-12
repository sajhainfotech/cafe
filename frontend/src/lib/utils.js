import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Join a path onto NEXT_PUBLIC_API_URL, whether or not it ends in a slash.
 *
 * The env value currently ends in "/", so `${API_URL}/api/x` produced
 * "host//api/x" while `${API_URL}api/x` produced "host/api/x" — both shapes
 * exist in this codebase. It happens to work today, and breaks the day someone
 * sets the variable without the trailing slash.
 *
 *   apiUrl("/api/tables/")  ->  http://host:8000/api/tables/
 */
export function apiUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
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
