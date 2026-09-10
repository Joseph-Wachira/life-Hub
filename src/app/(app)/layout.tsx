import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/services/workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/constants/cookies";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.onboardingProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile?.completedAt) redirect("/onboarding");

  const jar = await cookies();
  const { workspaces, active } = await resolveActiveWorkspace(
    session.user.id,
    jar.get(ACTIVE_WORKSPACE_COOKIE)?.value
  );

  if (!active) redirect("/onboarding");

  return (
    <AppShell workspace={active} workspaces={workspaces} user={session.user}>
      {children}
    </AppShell>
  );
}
