"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "../db";
import { createSession, destroySession, requireUser, setActiveBranch } from "../session";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type LoginState = { error: string; username: string } | null;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const fail = (error: string) => ({ error, username });
  if (!username || !password) return fail("Enter your username and password.");

  const [user] = await sql`
    select id, password_hash, active, failed_attempts, locked_until > now() as locked
    from users where lower(username) = ${username}`;

  if (user?.locked) return fail(`Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`);

  const ok = user && user.active && (await bcrypt.compare(password, user.password_hash as string));
  if (!ok) {
    if (user) {
      await sql`
        update users set
          failed_attempts = failed_attempts + 1,
          locked_until = case when failed_attempts + 1 >= ${MAX_ATTEMPTS}
                              then now() + make_interval(mins => ${LOCK_MINUTES}) end
        where id = ${user.id}`;
    }
    return fail("Incorrect username or password.");
  }

  await sql`update users set failed_attempts = 0, locked_until = null where id = ${user.id}`;
  await createSession(user.id as number);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function switchBranch(form: FormData) {
  const user = await requireUser();
  if (!user.branch) await setActiveBranch(String(form.get("branch") ?? "all"));
  redirect(String(form.get("back") || "/dashboard"));
}

export async function changePassword(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return "New password must be at least 8 characters.";
  if (next !== form.get("confirm")) return "New passwords do not match.";
  const [row] = await sql`select password_hash from users where id = ${user.id}`;
  if (!(await bcrypt.compare(current, row.password_hash as string))) return "Current password is incorrect.";
  await sql`update users set password_hash = ${await bcrypt.hash(next, 12)} where id = ${user.id}`;
  return "ok";
}
