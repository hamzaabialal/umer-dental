import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { LoginBackground } from "./LoginBackground";

export const metadata = { title: "Sign in — Umar Dental & Implant Center" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#06152b] p-4">
      <LoginBackground />

      <div className="login-card relative z-10 w-full max-w-sm">
        <div className="rounded-3xl bg-gradient-to-b from-[#e8c766]/70 via-white/10 to-[#e8c766]/30 p-px shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <div className="rounded-3xl bg-white/95 p-8 backdrop-blur-xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="login-logo relative">
                <div className="login-logo-glow" />
                <LogoMark size={68} className="relative" />
              </div>
              <h1 className="mt-3 text-xl font-extrabold tracking-wide text-[#123a6b]">UMAR DENTAL</h1>
              <p className="text-[11px] font-medium tracking-[0.3em] text-[#123a6b]">& IMPLANT CENTER</p>
              <div className="mt-4 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a24a] to-transparent" />
              <p className="mt-3 text-sm text-slate-500">Sign in to the clinic system</p>
            </div>
            <LoginForm />
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] tracking-[0.35em] text-[#e8c766]/80">CARE • COMFORT • CONFIDENCE</p>
      </div>
    </main>
  );
}
