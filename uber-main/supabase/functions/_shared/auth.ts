/** Mirrors client-side clerkIdToUuid for consistent user ID mapping. */
export function clerkIdToUuid(clerkId: string): string {
  if (!clerkId) return "00000000-0000-4000-8000-000000000000";
  if (clerkId.length === 36 && clerkId.includes("-")) return clerkId;

  let h1 = 0x811c9dc5,
    h2 = 0xcbf29ce4,
    h3 = 0x5851f42d,
    h4 = 0x9e3779b9;
  for (let i = 0; i < clerkId.length; i++) {
    const c = clerkId.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
    h3 = Math.imul(h3 ^ c, 0x01000193);
    h4 = Math.imul(h4 ^ c, 0x01000193);
  }

  const pad = (n: number) =>
    Math.abs(n).toString(16).padStart(8, "0").slice(0, 8);
  const combined = (pad(h1) + pad(h2) + pad(h3) + pad(h4)).slice(0, 32);

  return [
    combined.slice(0, 8),
    combined.slice(8, 12),
    "4" + combined.slice(13, 16),
    ((parseInt(combined.charAt(16), 16) & 0x3) | 0x8).toString(16) +
      combined.slice(17, 20),
    combined.slice(20, 32),
  ].join("-");
}

/** Extract authenticated user UUID from Clerk/Supabase JWT. */
export function getUserIdFromAuthHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(atob(token.split(".")[1]));
    const sub = payload?.sub as string | undefined;
    if (!sub) return null;
    return clerkIdToUuid(sub);
  } catch {
    return null;
  }
}
