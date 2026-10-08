"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") === q) return;
      const next = new URLSearchParams(sp);
      if (q) next.set("q", q);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next}`);
    }, 300);
    return () => clearTimeout(t);
  }, [q, sp, pathname, router]);

  return <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input max-w-md" />;
}

export function Pager({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(p));
    return `${pathname}?${next}`;
  };
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      {page > 1 && (
        <Link href={href(page - 1)} className="btn-ghost">
          ← Prev
        </Link>
      )}
      <span className="text-slate-500">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className="btn-ghost">
          Next →
        </Link>
      )}
    </div>
  );
}
