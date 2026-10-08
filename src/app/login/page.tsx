import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Umar Dental & Implant Center" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#081d36] to-[#123a6b] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={64} />
          <h1 className="mt-3 text-xl font-extrabold tracking-wide text-[#123a6b]">UMAR DENTAL</h1>
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#123a6b]">& IMPLANT CENTER</p>
          <p className="mt-3 text-sm text-slate-500">Sign in to the clinic system</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
