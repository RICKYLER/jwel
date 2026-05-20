export function normalizeText(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}