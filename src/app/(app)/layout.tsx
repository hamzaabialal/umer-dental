import { Shell } from "@/components/Shell";
import { activeBranch, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const branch = await activeBranch(user);
  return (
    <Shell user={user} branch={branch}>
      {children}
    </Shell>
  );
}
