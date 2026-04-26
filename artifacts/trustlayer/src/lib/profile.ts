import type { Models } from "appwrite";
import { account } from "./appwrite";

/**
 * User profile is persisted per-user in Appwrite as Account preferences
 * (the built-in `users_profile` store on the Account object). Using the
 * preferences API keeps profile data attached to the authenticated user
 * with no extra collection or permissions setup needed.
 */
export type UserProfile = {
  full_name: string;
  role: string;
  organization: string;
  timezone: string;
  notifications_enabled: boolean;
  risk_threshold: number;
};

export const DEFAULT_PROFILE: UserProfile = {
  full_name: "",
  role: "",
  organization: "",
  timezone: "",
  notifications_enabled: true,
  risk_threshold: 5,
};

function pickString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function pickNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function readProfileFromUser(
  user: Models.User<Models.Preferences> | null,
): UserProfile {
  if (!user) return { ...DEFAULT_PROFILE };
  const prefs = (user.prefs ?? {}) as Record<string, unknown>;
  return {
    full_name: pickString(prefs.full_name, user.name || ""),
    role: pickString(prefs.role),
    organization: pickString(prefs.organization),
    timezone: pickString(prefs.timezone),
    notifications_enabled: pickBool(prefs.notifications_enabled, true),
    risk_threshold: clampThreshold(pickNumber(prefs.risk_threshold, 5)),
  };
}

export function clampThreshold(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(50, Math.round(n)));
}

/**
 * Loads the user profile, materializing defaults the first time around.
 * Writes the merged profile back so subsequent reads have a stable shape.
 */
export async function loadOrCreateProfile(
  user: Models.User<Models.Preferences>,
): Promise<UserProfile> {
  const current = readProfileFromUser(user);
  const prefs = (user.prefs ?? {}) as Record<string, unknown>;
  const needsHydration =
    typeof prefs.notifications_enabled !== "boolean" ||
    typeof prefs.risk_threshold !== "number" ||
    typeof prefs.full_name !== "string";
  if (needsHydration) {
    await account.updatePrefs({ ...prefs, ...current });
  }
  return current;
}

export async function updateProfile(
  user: Models.User<Models.Preferences>,
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const merged: UserProfile = {
    ...readProfileFromUser(user),
    ...patch,
  };
  merged.risk_threshold = clampThreshold(merged.risk_threshold);
  const prefs = (user.prefs ?? {}) as Record<string, unknown>;
  await account.updatePrefs({ ...prefs, ...merged });
  // Keep the auth `name` field in sync when the user updates full_name —
  // this is what shows in the header avatar.
  if (
    typeof patch.full_name === "string" &&
    patch.full_name.trim() &&
    patch.full_name.trim() !== user.name
  ) {
    try {
      await account.updateName(patch.full_name.trim());
    } catch {
      // Name update is best-effort; preferences are the source of truth.
    }
  }
  return merged;
}

export const TIMEZONE_OPTIONS: string[] = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [
      "UTC",
      "America/Los_Angeles",
      "America/Denver",
      "America/Chicago",
      "America/New_York",
      "America/Sao_Paulo",
      "Europe/London",
      "Europe/Berlin",
      "Europe/Paris",
      "Africa/Johannesburg",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];
  }
})();
