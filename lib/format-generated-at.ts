function parseStamp(iso: string): Date | null {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/** `yyyy-mm-dd hh:mi UTC`, or null if the ISO stamp is invalid. */
export function formatStampUtc(iso: string): string | null {
  const d = parseStamp(iso);
  if (!d) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

/** Locale stamp, or null if the ISO stamp is invalid. */
export function formatStampLocal(
  iso: string,
  options?: Intl.DateTimeFormatOptions,
): string | null {
  const d = parseStamp(iso);
  if (!d) return null;
  return options
    ? d.toLocaleString(undefined, options)
    : d.toLocaleString();
}
