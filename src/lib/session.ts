import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import type { Branch } from "./format";

export const SESSION_COOKIE = "udc_session";
const BRANCH_COOKIE = "udc_branch";
const SESSION_DAYS = 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

export type Role = "admin" | "doctor" | "receptionist";
export type User = {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  branch: Branch | null;
  calendar_token: string;
};

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Verifies the session cookie and re-reads the user, so deactivated accounts lose access immediately. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const rows = await sql`
      select id, username, full_name, role, branch, calendar_token
      from users where id = ${Number(payload.uid)} and active`;
    return (rows[0] as User) ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/** The branch a user is currently looking at: receptionists are pinned to theirs. null = all branches. */
export async function activeBranch(user: User): Promise<Branch | null> {
  if (user.branch) return user.branch;
  const v = (await cookies()).get(BRANCH_COOKIE)?.value;
  return v === "Bahria" || v === "PWD" ? v : null;
}

export async function setActiveBranch(v: string) {
  (await cookies()).set(BRANCH_COOKIE, v, { path: "/", sameSite: "lax", maxAge: 365 * 86400 });
}

/** Throws unless the user may write records for this branch. */
export function assertBranch(user: User, branch: string): Branch {
  if (branch !== "Bahria" && branch !== "PWD") throw new Error("Invalid branch");
  if (user.branch && user.branch !== branch) throw new Error("You can only work in your own branch");
  return branch;
}
