"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { FocusArea, WorkspaceType } from "@prisma/client";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import type { ActionResult } from "@/lib/actions/auth";
import { FOCUS_AREA_META, FOCUS_AREA_ORDER, ROLE_OPTIONS } from "@/lib/constants/focus-areas";
import { WORKSPACE_TYPE_META, WORKSPACE_TYPE_ORDER } from "@/lib/constants/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEPS = ["What matters to you", "About you", "Your first workspace", "Review"] as const;

function suggestWorkspace(areas: FocusArea[]): { name: string; type: WorkspaceType } {
  if (areas.includes("WORK")) return { name: "Work", type: "WORK" };
  if (areas.includes("EDUCATION")) return { name: "School", type: "SCHOOL" };
  return { name: "Personal", type: "PERSONAL" };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Setting things up…" : "Enter Life Hub"}
    </Button>
  );
}

export function OnboardingWizard() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(completeOnboardingAction, null);
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<Set<FocusArea>>(new Set());
  const [role, setRole] = useState<string>("");
  const suggested = useMemo(() => suggestWorkspace([...areas]), [areas]);
  const [workspaceName, setWorkspaceName] = useState(suggested.name);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(suggested.type);
  const [nameTouched, setNameTouched] = useState(false);

  function toggleArea(area: FocusArea) {
    setAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      if (!nameTouched) {
        const s = suggestWorkspace([...next]);
        setWorkspaceName(s.name);
        setWorkspaceType(s.type);
      }
      return next;
    });
  }

  const canAdvance = step !== 0 || areas.size > 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i <= step ? "bg-[var(--brand)]" : "bg-[var(--surface-sunken)]"
              )}
            />
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-medium text-[var(--foreground)]" : "text-[var(--subtle-foreground)]"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-6">
        <section className={cn("flex flex-col gap-4", step !== 0 && "hidden")} aria-hidden={step !== 0}>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">What would you like to manage?</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Pick as many as you like — your dashboard adapts to match.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FOCUS_AREA_ORDER.map((area) => {
              const meta = FOCUS_AREA_META[area];
              const Icon = meta.icon;
              const selected = areas.has(area);
              return (
                <label
                  key={area}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition-all",
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand-muted)] shadow-[var(--shadow-sm)]"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <input
                    type="checkbox"
                    name="focusAreas"
                    value={area}
                    checked={selected}
                    onChange={() => toggleArea(area)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                      selected ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "bg-[var(--surface-sunken)]"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{meta.description}</span>
                  </span>
                  {selected && <Check className="ml-auto size-4 shrink-0 text-[var(--brand)]" />}
                </label>
              );
            })}
          </div>
        </section>

        <section className={cn("flex flex-col gap-4", step !== 1 && "hidden")} aria-hidden={step !== 1}>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">What best describes you?</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Optional — helps us tune suggestions.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROLE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setRole(role === opt.value ? "" : opt.value)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors",
                  role === opt.value
                    ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={role} />
        </section>

        <section className={cn("flex flex-col gap-4", step !== 2 && "hidden")} aria-hidden={step !== 2}>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Set up your first workspace</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Workspaces keep areas of your life separate. You can add more later.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input
              id="workspaceName"
              name="workspaceName"
              value={workspaceName}
              onChange={(e) => {
                setNameTouched(true);
                setWorkspaceName(e.target.value);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Workspace type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WORKSPACE_TYPE_ORDER.map((type) => {
                const meta = WORKSPACE_TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setWorkspaceType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-3 text-xs transition-colors",
                      workspaceType === type
                        ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <Icon className="size-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input type="hidden" name="workspaceType" value={workspaceType} />
        </section>

        <section className={cn("flex flex-col gap-4", step !== 3 && "hidden")} aria-hidden={step !== 3}>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">You&apos;re all set</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Here&apos;s what we&apos;ll set up for you.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Focus areas</span>
              <span className="font-medium">
                {[...areas].map((a) => FOCUS_AREA_META[a].label).join(", ") || "None selected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Workspace</span>
              <span className="font-medium">
                {workspaceName} · {WORKSPACE_TYPE_META[workspaceType].label}
              </span>
            </div>
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
        </section>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="size-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => canAdvance && setStep((s) => s + 1)} disabled={!canAdvance}>
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <SubmitButton />
          )}
        </div>
      </form>
    </div>
  );
}
