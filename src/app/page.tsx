import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  FolderKanban,
  NotebookText,
  Sparkles,
  Target,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Calendar,
    title: "Calendar & planner",
    description: "Daily, weekly, and monthly views with drag-and-drop scheduling and smart reminders.",
  },
  {
    icon: CheckCircle2,
    title: "Tasks & projects",
    description: "Priorities, subtasks, tags, and progress tracking that scales from errands to launches.",
  },
  {
    icon: Timer,
    title: "Focus system",
    description: "Pomodoro and deep-work sessions with session notes and productivity analytics.",
  },
  {
    icon: Wallet,
    title: "Personal finance",
    description: "Budgets, bills, savings goals, and spending charts — all in one clear picture.",
  },
  {
    icon: NotebookText,
    title: "Notes hub",
    description: "Rich notes with folders, tags, checklists, and links back to tasks and projects.",
  },
  {
    icon: Flame,
    title: "Habits & wellbeing",
    description: "Streaks, mood check-ins, sleep, exercise, and water — gentle nudges, not guilt trips.",
  },
  {
    icon: Target,
    title: "Goals & milestones",
    description: "Personal, financial, fitness, career, and learning goals with real progress views.",
  },
  {
    icon: FolderKanban,
    title: "Workspaces",
    description: "Separate Personal, Work, School, Family, or Side-Project areas — switch in one click.",
  },
];

const AUDIENCES = ["Students", "Employees", "Freelancers", "Entrepreneurs", "Families"];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-[var(--brand-foreground)]">
              <Sparkles className="size-4" />
            </span>
            Life Hub
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Badge variant="secondary" className="px-3 py-1">
              One hub for your entire life
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Your schedule, goals, money, and mind —{" "}
              <span className="text-[var(--brand)]">finally in one calm place.</span>
            </h1>
            <p className="max-w-xl text-balance text-lg text-[var(--muted-foreground)]">
              Life Hub is the personal operating system for people who juggle work, school,
              finances, and wellbeing — without juggling ten different apps.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start for free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {AUDIENCES.map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 0%, oklch(0.58 0.17 275 / 0.14), transparent 40%), radial-gradient(circle at 85% 100%, oklch(0.62 0.15 155 / 0.12), transparent 45%)",
              }}
            />
            <div className="relative grid grid-cols-1 gap-4 p-6 sm:grid-cols-3 sm:p-10">
              {[
                { label: "Today's focus", value: "3 sessions · 2h 15m", icon: Timer },
                { label: "This month", value: "$1,240 saved", icon: Wallet },
                { label: "Current streak", value: "12-day habit streak", icon: Flame },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)]"
                >
                  <stat.icon className="mb-3 size-5 text-[var(--brand)]" />
                  <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface-sunken)]/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Every module you actually need</h2>
              <p className="mt-3 text-[var(--muted-foreground)]">
                No plugins, no tab-switching. Just one thoughtfully designed system.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
                >
                  <span className="mb-3 flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-muted)] text-[var(--brand)]">
                    <f.icon className="size-4" />
                  </span>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Ready to bring it all together?</h2>
            <p className="text-[var(--muted-foreground)]">
              Onboarding takes under a minute — tell us what you want to manage and your
              dashboard adapts instantly.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Create your free account <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-[var(--subtle-foreground)] sm:flex-row">
          <span>© {new Date().getFullYear()} Life Hub. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[var(--foreground)]">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-[var(--foreground)]">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
