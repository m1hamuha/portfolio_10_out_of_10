import { PRESETS } from "../presets";
import type { Answers, Preset } from "../types";
import { useLang } from "../i18n";
import { cx, SparklesIcon } from "./ui";

interface Props {
  onSelectPreset: (answers: Answers) => void;
  currentSystem?: string;
  className?: string;
}

export function PresetsBar({ onSelectPreset, currentSystem, className }: Props) {
  const { lang } = useLang();

  const badgeColorClass = (color?: Preset["badgeColor"]) => {
    switch (color) {
      case "red":
        return "bg-risk-high/15 text-risk-high border-risk-high/30";
      case "amber":
        return "bg-risk-med/15 text-risk-med border-risk-med/30";
      case "green":
        return "bg-ok/15 text-ok border-ok/30";
      default:
        return "bg-line text-ink-2 border-line";
    }
  };

  return (
    <div
      className={cx(
        "rounded-xl2 border border-line bg-surface p-4 sm:p-5 shadow-card no-print",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-white">
            <SparklesIcon className="h-3.5 w-3.5" />
          </span>
          <span className="font-display text-[0.88rem] font-extrabold uppercase tracking-wider text-ink">
            {lang === "uk"
              ? "Демо-сценарії в 1 клік (без заповнення)"
              : "1-Click Employer Presets (Zero Data Entry)"}
          </span>
        </div>
        <span className="text-[0.82rem] font-semibold text-ink-2">
          {lang === "uk" ? "Миттєвий перехід до звіту" : "Instant Report Evaluation"}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => {
          const isActive = currentSystem === p.answers.system;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.answers)}
              className={cx(
                "group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-150",
                isActive
                  ? "border-accent bg-accent-soft ring-2 ring-accent/20"
                  : "border-line bg-paper hover:border-accent hover:bg-surface hover:shadow-sm",
              )}
            >
              <div className="flex w-full items-center justify-between gap-1.5 mb-1.5">
                <span className="font-display text-[0.95rem] font-bold text-ink group-hover:text-accent transition-colors">
                  {p.name}
                </span>
                <span
                  className={cx(
                    "rounded-full border px-2 py-0.5 font-display text-[0.72rem] font-bold",
                    badgeColorClass(p.badgeColor),
                  )}
                >
                  {p.badge}
                </span>
              </div>
              <p className="text-[0.84rem] leading-relaxed text-ink-2 line-clamp-2">
                {p.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
