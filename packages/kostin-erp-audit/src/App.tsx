import { useMemo, useState } from "react";
import { emptyAnswers } from "./questions";
import type { Answers, Lang } from "./types";
import { generateReport } from "./generateReport";
import { track } from "./analyticsConfig";
import { LangCtx, STR } from "./i18n";
import { Intro } from "./components/Intro";
import { Questionnaire } from "./components/Questionnaire";
import { ReportView } from "./components/Report";
import { cx, PulseIcon } from "./components/ui";

type Screen = "intro" | "quiz" | "report";

function detectLang(): Lang {
  if (typeof navigator !== "undefined" && /uk|ua/i.test(navigator.language))
    return "uk";
  return "en";
}

export function App() {
  const [lang, setLang] = useState<Lang>(detectLang);
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);

  // Report is derived from answers + language, so toggling language
  // re-localizes the report instantly.
  const report = useMemo(
    () => (screen === "report" ? generateReport(answers, lang) : null),
    [screen, answers, lang],
  );

  function start() {
    setAnswers(emptyAnswers);
    setScreen("quiz");
    track("audit_started");
    window.scrollTo({ top: 0 });
  }

  function finish(final: Answers) {
    setAnswers(final);
    setScreen("report");
    track("audit_completed");
    window.scrollTo({ top: 0 });
  }

  function handleSelectPreset(presetAnswers: Answers) {
    setAnswers(presetAnswers);
    setScreen("report");
    track("audit_preset_selected");
    window.scrollTo({ top: 0 });
  }

  function restart() {
    setAnswers(emptyAnswers);
    setScreen("intro");
    window.scrollTo({ top: 0 });
  }

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader lang={lang} setLang={setLang} onLogoClick={restart} />
        <main className="flex-1">
          {screen === "intro" && (
            <Intro onStart={start} onSelectPreset={handleSelectPreset} />
          )}
          {screen === "quiz" && (
            <Questionnaire
              initial={answers}
              onSubmit={finish}
              onExit={restart}
              onSelectPreset={handleSelectPreset}
            />
          )}
          {screen === "report" && report && (
            <ReportView
              report={report}
              onRestart={restart}
              onSelectPreset={handleSelectPreset}
            />
          )}
        </main>
        <SiteFooter lang={lang} />
      </div>
    </LangCtx.Provider>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const opts: Lang[] = ["en", "uk"];
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
      role="group"
      aria-label="Language"
    >
      {opts.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cx(
            "rounded-md px-3 py-1.5 font-display text-[0.85rem] font-bold transition-colors",
            lang === l ? "bg-ink text-white" : "text-ink-2 hover:text-ink",
          )}
        >
          {l === "en" ? "EN" : "УКР"}
        </button>
      ))}
    </div>
  );
}

function SiteHeader({
  lang,
  setLang,
  onLogoClick,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onLogoClick: () => void;
}) {
  const s = STR[lang];
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-3.5 md:px-8">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 text-left"
          aria-label={s.ui.homeAria}
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white">
            <PulseIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-[1.05rem] font-extrabold leading-tight tracking-tight text-ink">
            {s.ui.brand}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <a
            href="#cta"
            className="hidden text-[0.95rem] font-semibold text-accent hover:text-accent-ink sm:inline"
          >
            {s.ui.headerCta}
          </a>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ lang }: { lang: Lang }) {
  const s = STR[lang];
  return (
    <footer className="no-print border-t border-line bg-surface">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-5 py-7 text-[0.95rem] text-ink-2 md:px-8">
        <p className="font-semibold text-ink">{s.ui.brand}</p>
        <p>{s.ui.footerTagline}</p>
        <p>
          {s.ui.contactPrefix}
          <a
            className="font-semibold text-accent hover:text-accent-ink"
            href="mailto:kostinmihail40@gmail.com"
          >
            kostinmihail40@gmail.com
          </a>
        </p>
        <div className="flex items-center gap-3 pt-2 text-xs text-ink-3">
          <a
            href="https://m1hamuha.github.io/portfolio/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            ← Central Portfolio Hub
          </a>
          <span>·</span>
          <a
            href="https://github.com/m1hamuha/portfolio_10_out_of_10"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            GitHub Repository
          </a>
        </div>
      </div>
    </footer>
  );
}
