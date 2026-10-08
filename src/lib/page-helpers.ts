import "server-only";
import { activeBranch, requireUser, type User } from "./session";
import { BRANCHES } from "./format";
import { getPatient, type Patient } from "./data";

/** Common context for pages: user, the branch being viewed, and what branches forms may write to. */
export async function pageContext() {
  const user = await requireUser();
  const branch = await activeBranch(user);
  const writable: string[] = user.branch ? [user.branch] : [...BRANCHES];
  return { user, branch, writable, defaultBranch: branch ?? writable[0] };
}

/** Optional ?mr= prefill for forms opened from a patient profile. */
export async function prefillPatient(sp: Promise<Record<string, string | string[] | undefined>>): Promise<Patient | null> {
  const mr = (await sp).mr;
  return typeof mr === "string" && mr ? getPatient(mr) : null;
}

export type { User };
