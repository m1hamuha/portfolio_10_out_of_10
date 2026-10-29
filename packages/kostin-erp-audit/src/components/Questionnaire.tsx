import { useMemo, useState } from "react";
import { getSteps } from "../questions";
import type { Step } from "../questions";
import type { Answers } from "../types";
import { useLang, useStr } from "../i18n";
import { Button, cx, CheckIcon, ArrowIcon } from "./ui";
import { PresetsBar } from "./PresetsBar";

interface Props {
  initial: Answers;
  onSubmit: (a: Answers) => void;
  onExit: () => void;
  onSelectPreset?: (a: Answers) => void;
}

export function Questionnaire({ initial, onSubmit, onExit, onSelectPreset }: Props) {
  const { lang } = useLang();
  const s = useStr();
  const steps = useMemo(() => getSteps(lang), [lang]);
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(initial);
  const step = steps[i];
  const isLast = i === steps.length - 1;
  const progress = Math.round(((i + 1) / steps.length) * 100);

  const canNext = useMemo(() => stepComplete(step, a), [step, a]);

  function next() {
    if (isLast) {
      onSubmit(a);
      return;
    }
    setI((v) => Math.min(v + 1, steps.length - 1));
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (i === 0) {
      onExit();
      return;
    }
    setI((v) => Math.max(v - 1, 0));
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-12">
      {onSelectPreset && (
        <PresetsBar
          onSelectPreset={onSelectPreset}
          currentSystem={a.system}
          className="mb-8"
        />
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-[0.95rem] font-bold text-ink">
            {s.quiz.stepWord} {i + 1} {s.quiz.ofWord} {steps.length}
          </span>
          <span className="tnum text-[0.95rem] font-semibold text-ink-2">
            {progress}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div key={i} className="animate-rise">
        <h2 className="font-display text-[1.7rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2.05rem]">
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="mt-2 text-[1.05rem] leading-relaxed text-ink">
            {step.subtitle}
          </p>
        )}

        <div className="mt-6">
          {step.kind === "single" && (
            <SingleField
              step={step}
              answers={a}
              set={setA}
              onPick={() => !isLast && setTimeout(next, 160)}
            />
          )}
          {step.kind === "multi" && (
            <MultiField step={step} answers={a} set={setA} />
          )}
          {step.kind === "metrics" && (
            <MetricsField step={step} answers={a} set={setA} />
          )}
          {step.kind === "pains" && (
            <PainsField step={step} answers={a} set={setA} />
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-9 flex items-center justify-between gap-3">
        <Button variant="ghost" size="md" onClick={back}>
          {s.quiz.back}
        </Button>
        <Button onClick={next} disabled={!canNext}>
          {isLast ? s.quiz.showReport : s.quiz.next}
          <ArrowIcon className="h-5 w-5" />
        </Button>
      </div>
      {(step.kind === "multi" || step.kind === "pains") && (
        <p className="mt-3 text-center text-[0.92rem] text-ink-2">
          {s.quiz.multiHint}
        </p>
      )}
    </div>
  );
}

function stepComplete(step: Step, a: Answers): boolean {
  if (step.kind === "single") return !!a[step.key];
  if (step.kind === "multi") return (a[step.key] as string[]).length > 0;
  return true; // metrics & pains optional
}

/* ---------------- Single choice ---------------- */
function SingleField({
  step,
  answers,
  set,
  onPick,
}: {
  step: Extract<Step, { kind: "single" }>;
  answers: Answers;
  set: (a: Answers) => void;
  onPick: () => void;
}) {
  const current = answers[step.key] as string;
  return (
    <div className="grid gap-3">
      {step.options.map((opt) => {
        const active = current === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => {
              set({ ...answers, [step.key]: opt.id });
              onPick();
            }}
            className={cx(
              "flex items-center gap-4 rounded-xl border-2 bg-surface px-5 py-4 text-left transition-colors duration-150",
              active ? "border-accent bg-accent-soft" : "border-line hover:border-ink/25",
            )}
          >
            <span
              className={cx(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                active ? "border-accent bg-accent text-white" : "border-line",
              )}
            >
              {active && <CheckIcon className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[1.12rem] font-bold text-ink">
                {opt.label}
              </span>
              {opt.hint && (
                <span className="mt-0.5 block text-[0.95rem] text-ink-2">
                  {opt.hint}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Multi choice ---------------- */
function MultiField({
  step,
  answers,
  set,
}: {
  step: Extract<Step, { kind: "multi" }>;
  answers: Answers;
  set: (a: Answers) => void;
}) {
  const selected = answers[step.key] as string[];
  function toggle(id: string) {
    let nextSel: string[];
    if (step.noneId && id === step.noneId) {
      nextSel = selected.includes(id) ? [] : [id];
    } else {
      const without = selected.filter((x) => x !== step.noneId);
      nextSel = without.includes(id)
        ? without.filter((x) => x !== id)
        : [...without, id];
    }
    set({ ...answers, [step.key]: nextSel });
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {step.options.map((opt) => (
        <OptionToggle
          key={opt.id}
          label={opt.label}
          hint={opt.hint}
          active={selected.includes(opt.id)}
          onClick={() => toggle(opt.id)}
        />
      ))}
    </div>
  );
}

/* ---------------- Metrics (compact numeric pickers) ---------------- */
function MetricsField({
  step,
  answers,
  set,
}: {
  step: Extract<Step, { kind: "metrics" }>;
  answers: Answers;
  set: (a: Answers) => void;
}) {
  return (
    <div className="grid gap-6">
      {step.groups.map((g) => {
        const current = answers[g.key] as string;
        return (
          <div key={g.key as string}>
            <p className="mb-2.5 font-display text-[1.05rem] font-bold leading-snug text-ink">
              {g.label}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {g.options.map((opt) => {
                const active = current === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      set({ ...answers, [g.key]: active ? "" : opt.id })
                    }
                    aria-pressed={active}
                    className={cx(
                      "rounded-xl border-2 px-4 py-2.5 font-display text-[1.02rem] font-bold transition-colors duration-150",
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-surface text-ink hover:border-ink/25",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Pains (multi + free text) ---------------- */
function PainsField({
  step,
  answers,
  set,
}: {
  step: Extract<Step, { kind: "pains" }>;
  answers: Answers;
  set: (a: Answers) => void;
}) {
  const selected = answers.pains;
  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    set({ ...answers, pains: next });
  }
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {step.options.map((opt) => (
          <OptionToggle
            key={opt.id}
            label={opt.label}
            active={selected.includes(opt.id)}
            onClick={() => toggle(opt.id)}
          />
        ))}
      </div>
      <label className="mt-6 block">
        <span className="mb-2 block font-display text-[1.02rem] font-bold text-ink">
          {step.textLabel}
        </span>
        <textarea
          value={answers.painText}
          onChange={(e) => set({ ...answers, painText: e.target.value })}
          placeholder={step.textPlaceholder}
          rows={4}
          className="w-full resize-y rounded-xl border-2 border-line bg-surface px-4 py-3 text-[1.05rem] text-ink placeholder:text-ink-2/70 focus:border-accent focus:outline-none"
        />
      </label>
    </div>
  );
}

function OptionToggle({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex items-center gap-3.5 rounded-xl border-2 bg-surface px-4 py-3.5 text-left transition-colors duration-150",
        active ? "border-accent bg-accent-soft" : "border-line hover:border-ink/25",
      )}
    >
      <span
        className={cx(
          "grid h-6 w-6 shrink-0 place-items-center rounded-md border-2",
          active ? "border-accent bg-accent text-white" : "border-line",
        )}
      >
        {active && <CheckIcon className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[1.05rem] font-bold leading-snug text-ink">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-[0.9rem] text-ink-2">{hint}</span>}
      </span>
    </button>
  );
}
