"use client";

/**
 * Cookie helpers. Previously copy-pasted into ~8 page files; import from here.
 * All of these are no-ops during SSR/prerender instead of throwing.
 */

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export function setCookie(
  name,
  value,
  { days = 1, path = "/", sameSite = "Strict" } = {},
) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value ?? ""}; expires=${expires}; path=${path}; SameSite=${sameSite}`;
}

export function deleteCookie(name, { path = "/" } = {}) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

/** Token every authenticated request uses. */
export function getAuthToken() {
  return getCookie("adminToken");
}

/** Authorization header, or `{}` when unauthenticated. */
export function authHeader() {
  const token = getAuthToken();
  return token ? { Authorization: `Token ${token}` } : {};
}

/**
 * sessionStorage reads that are safe to call during render. Returns `fallback`
 * on the server, where sessionStorage does not exist.
 */
export function getSession(key, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return window.sessionStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
