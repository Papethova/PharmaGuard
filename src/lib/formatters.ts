import { UserProfile } from "../types";

export const escapeEmail = (text: string | null | undefined) => {
  return text || "";
};

export const getIdentityString = (profile: UserProfile | null, userEmail?: string | null) => {
  const identity = profile?.organizationName || profile?.displayName || userEmail || "Identity Unverified";
  return identity;
};

export const formatDateTime = (timestamp: any) => {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

export const formatRefForDisplay = (ref: string | undefined) => {
  if (!ref || !ref.startsWith("VER-")) return ref;
  
  // Check if it's in the old format: VER-YYYYMMDD-HHMM
  const oldFormatMatch = ref.match(/^VER-(\d{4})(\d{2})(\d{2})-(.*)$/);
  if (oldFormatMatch) {
    const [_, year, month, day, suffix] = oldFormatMatch;
    const shortYear = year.slice(-2);
    return `VER-${month}${day}${shortYear}-${suffix}`;
  }
  return ref;
};
