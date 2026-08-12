export function readCssColor(token: string) {
  if (typeof window === "undefined") return "transparent";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "transparent";
}
