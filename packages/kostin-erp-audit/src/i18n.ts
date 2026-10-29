import { createContext, useContext } from "react";
import type { Lang } from "./types";

/* ============================================================
   Bilingual content. English is primary (Europe / US);
   Ukrainian is the second market. No Russian.
   Prices in EUR. Plain, human copy. No long dashes.
   ============================================================ */

const en = {
  ui: {
    brand: "ERP Health Audit",
    headerCta: "Get started",
    footerTagline:
      "Odoo ERP: setup, custom work, and ongoing support.",
    contactPrefix: "Contact: ",
    toEn: "EN",
    toUk: "УКР",
    homeAria: "Back to start",
  },

  intro: {
    badge: "Free · No sign-up · 2 minutes",
    h1a: "Audit your business system",
    h1b: "in 2 minutes",
    sub: "Answer a few simple questions. You get a clear report: a health score, your biggest risks, and a recommended path on Odoo.",
    odooNote: "Built on Odoo, the open-source ERP.",
    ctaStart: "Start the audit",
    ctaNote: "Your report appears instantly",
    chips: ["2 to 3 minutes", "6 quick steps", "Clear report"],
    whatYouGetTitle: "What you'll get",
    getItems: [
      {
        t: "A health score",
        d: "One clear number from 0 to 100 for the state of your business system.",
      },
      {
        t: "Prioritized risks",
        d: "What's wrong and why it matters, in plain words.",
      },
      {
        t: "A recommended path",
        d: "Whether to implement, migrate, or optimize, and the steps to get there.",
      },
      {
        t: "Your impact in numbers",
        d: "What manual work costs you in hours and euros, plus packages and a starting price.",
      },
    ],

    whoForTitle: "Who this is for",
    whoForLead:
      "Your company is growing and your systems are starting to slow you down.",
    whoForItems: [
      "Owners and operations leads at companies of 5 to 200 people.",
      "Teams stuck on spreadsheets, 1C/BAS, QuickBooks, SAP, or a half-used Odoo.",
      "Anyone losing hours to manual data entry and numbers that never match.",
    ],

    howTitle: "How it works",
    howSteps: [
      {
        t: "1. Answer 6 quick questions",
        d: "About your system, your team, and what hurts most. Takes 2 to 3 minutes.",
      },
      {
        t: "2. Read your report on screen",
        d: "Health score, ranked risks, a plan, and what manual work is costing you.",
      },
      {
        t: "3. Choose a package and start",
        d: "Pick the package that fits, pay securely, and tell us about your setup. We start within a few business days.",
      },
    ],

    whyTitle: "Why work with me",
    whyItems: [
      {
        t: "Senior work, direct",
        d: "You work straight with the person building it. No account managers, no handoffs.",
      },
      {
        t: "Lean, so faster and cheaper",
        d: "A tight process with no agency layers. Projects move quicker and cost less.",
      },
      {
        t: "Fixed price, no surprises",
        d: "You get a clear scope and a fixed quote before we start. The number you agree is the number you pay.",
      },
      {
        t: "Built on open-source Odoo",
        d: "No per-user license fees. One system for accounting, sales, inventory, and CRM.",
      },
    ],

    previewKicker: "Sample report",
    previewScoreLabel: "Health score",
    previewZone: "Needs work",
    previewRisks: [
      { label: "Too much manual data entry", tag: "high" },
      { label: "Disconnected systems", tag: "med" },
      { label: "No reliable reporting", tag: "low" },
    ],
  },

  quiz: {
    stepWord: "Step",
    ofWord: "of",
    back: "Back",
    next: "Next",
    showReport: "Show my report",
    multiHint: "You can select several",
    steps: {
      system: {
        title: "What system does your business run on today?",
        subtitle: "Pick the main one you work in.",
      },
      market: {
        title: "Which market do you operate in?",
        subtitle: "Where your business is based or does most of its work.",
      },
      size: {
        title: "How many people use the system?",
        subtitle: "",
      },
      integrations: {
        title: "What's connected to your system?",
        subtitle: "Select everything you use.",
      },
      metrics: {
        title: "A few numbers, to put a value on it",
        subtitle:
          "Rough estimates are fine. These power the savings estimate in your report.",
        manualHoursLabel:
          "Hours per week your team spends on manual data entry and reconciliation",
        volumeLabel: "Orders or invoices per month",
        closeDaysLabel: "Days to close the books each month",
        doubleEntryLabel: "Is the same data entered into more than one system?",
      },
      pains: {
        title: "What hurts the most right now?",
        subtitle: "Select what applies. Add your own if you like.",
        textLabel: "Describe it in your own words (optional)",
        textPlaceholder:
          "e.g. month-end takes a week and the numbers never match",
      },
    },
  },

  report: {
    kicker: "ERP Health Audit",
    title: "Your business systems report",
    summaryTitle: "Summary",
    recommendationTitle: "Recommended path",
    risksTitle: "Identified risks",
    issueOne: "issue",
    issueMany: "issues",
    noRisks:
      "No clear problems showed up in the questionnaire, which is a good sign. A short check once we begin will confirm the full picture.",
    planTitle: "Recommended plan",
    packagesTitle: "What you get",
    packagesIntro: "Three ways to work together. Pick one or combine them.",
    recommendedBadge: "Recommended for you",
    priceLabel: "Estimated price",
    timelineLabel: "Timeline",
    fromWord: "from",
    perMonthWord: "/mo",
    estimateNote:
      "These figures are estimates. We confirm scope and a fixed quote with you in writing before any work starts.",
    trustLine:
      "A lean, direct studio. No agency overhead, no middlemen. Senior-level work, so you pay less.",
    // Area sub-scores
    subScoresTitle: "Where you stand, area by area",
    subScoreLabels: {
      data: "Data & integrations",
      automation: "Automation",
      compliance: "Compliance & risk",
      cost: "Cost-efficiency",
    },
    // Quantified impact
    impactKicker: "Impact in numbers",
    impactTitle: "What manual work is costing you",
    impactEstimate: "Estimate",
    impactHoursLabel: "Lost to manual work",
    impactHoursUnit: "hours / month",
    impactCostLabel: "Cost of that time",
    impactCostUnit: "/ month",
    impactSaveLabel: "Recoverable with Odoo",
    impactSaveUnit: "/ year",
    impactSaveSub: "About {hours} hours and {cost} back every month",
    impactAssumption:
      "Estimate only. It assumes about {rate}/hour fully loaded labour and Odoo automation removing about {pct}% of this manual work. We confirm your real numbers once we scope the work.",
    benchmarkKicker: "Benchmark",
    benchmarkBase:
      "Businesses your size that move to Odoo typically cut manual data entry by 40 to 60% and bring bank, sales, inventory, and invoicing into one connected system.",
    benchmarkClose:
      " They also shorten month-end close from {days} to a couple of days.",
    sev: { high: "High priority", med: "Medium priority", low: "Low priority" },
    zone: { green: "Healthy", amber: "Needs work", red: "At risk" },
    verdict: {
      green: "Your setup is in good shape. A few targeted improvements will help.",
      amber:
        "It works, but problems have built up that slow you down and add risk.",
      red: "There are serious risks here. Worth acting on soon.",
    },
    ctaTitle: "Ready to get started?",
    ctaBody:
      "Pick the package that fits, pay securely, and tell us about your setup. You get a clear status at every step, from kickoff to delivery.",
    // Lead capture (shown after the report so the value lands first)
    leadKicker: "Get it in writing",
    leadTitle: "Email me my full report and a fixed quote",
    leadBody:
      "Drop your email. I send your full report plus a fixed quote for your exact situation, no back and forth. Most owners start on Support, €240/mo, cancel anytime.",
    leadPlaceholder: "you@company.com",
    leadButton: "Send it to me",
    leadSending: "Sending",
    leadDoneTitle: "On its way",
    leadDoneBody:
      "Check your inbox shortly. Your full report and a fixed quote are on the way to you.",
    leadError: "Couldn't send. Email me directly: ",
    leadErrorLink: "send email",
    leadSubject: "New lead - report",
    // Easy-entry emphasis: the friction-free first yes
    easyKicker: "Easiest way to start",
    easyTitle: "Start with Support, €240/mo",
    easyBody:
      "The simplest first step. Cancel anytime. I keep your Odoo healthy and we pick up the bigger work from there. No long commitment to begin.",
    easyCta: "Start with Support",
    print: "Print / save as PDF",
    restart: "Retake the audit",
  },

  buy: {
    getStarted: "Get started",
    startBtn: "Get started",
    startCtaNote: "Secure checkout. Bank transfer available.",
    cancelAnytime: "Cancel anytime",
    startWithSupport: "Start with Support",
    modalKicker: "What happens next",
    chooseKicker: "Choose your plan",
    chooseTitle: "Start light, scale when ready",
    chooseSub: "Three ways in. Switch or add anytime.",
    startHere: "Start here",
    chooseBtn: "Choose",
    changePlan: "Change plan",
    perMonth: "/mo",
    steps: [
      {
        t: "Choose your plan and pay",
        d: "Pay securely with PayPal, or request a bank transfer.",
      },
      {
        t: "Tell us about your setup",
        d: "A short form so we can start fast.",
      },
      {
        t: "We start within a few business days",
        d: "Your project gets scheduled and underway.",
      },
      {
        t: "You get your deliverables",
        d: "With a clear status the whole way through.",
      },
    ],
    payTitle: "Choose your plan and pay",
    oneTimeNote: "One-time payment to begin.",
    subNote: "Monthly plan. Cancel anytime.",
    payLoading: "Loading secure checkout...",
    paypalUnconfigured:
      "Card and PayPal checkout is being finalized. Use bank transfer below to start now.",
    payWithLink: "Pay with PayPal",
    paidTitle: "Payment received",
    paidBody: "Thank you. Now tell us about your setup below so we can start.",
    paidSubject: "Payment received",
    bankToggle: "Pay by bank transfer instead",
    bankIntro:
      "Prefer a bank transfer? Request the details and we email them straight to you.",
    bankHow:
      "You request, we email you the bank details, you transfer, we confirm and start.",
    bankName: "Your name",
    bankEmail: "Email",
    bankCompany: "Company",
    bankSubmit: "Request bank details",
    bankSubmitting: "Sending",
    bankSubject: "Bank transfer request",
    intakeTitle: "Tell us about your setup",
    intakeSubtitle: "A few details so we can start fast. Takes a minute.",
    fCompany: "Company",
    fCompanyPh: "Company name",
    fSystem: "Current system",
    fSystemPh: "e.g. spreadsheets, 1C, QuickBooks, SAP",
    fGoal: "Main goal or what hurts most",
    fGoalPh: "What you most want to fix or achieve",
    fName: "Your name",
    fNamePh: "Name",
    fEmail: "Email",
    fEmailPh: "you@company.com",
    intakeSubmit: "Send my details",
    intakeSubmitting: "Sending",
    intakeSubject: "New onboarding intake",
    errorPrefix: "Couldn't send. Email us directly: ",
    errorLink: "send email",
    doneTitle: "You're all set",
    doneBody:
      "Thank you. We have your details and will be in touch shortly with your next step. You will have a clear status the whole way.",
    close: "Close",
  },

  labels: {
    system: {
      odoo: "Odoo",
      "1c": "1C",
      bas: "BAS",
      quickbooks: "QuickBooks",
      sap: "SAP",
      spreadsheets: "Spreadsheets (Excel / Google Sheets)",
      other: "Other / custom system",
    },
    systemHint: {
      odoo: "Open-source ERP",
      "1c": "Legacy ERP / accounting",
      bas: "1C-based, common in Ukraine",
      quickbooks: "Accounting software",
      sap: "Enterprise ERP",
      spreadsheets: "No real system yet",
      other: "Or not sure",
    },
    market: { us: "United States", eu: "Europe", ua: "Ukraine", other: "Other country" },
    size: {
      "1-5": "1 to 5 people",
      "6-20": "6 to 20 people",
      "21-50": "21 to 50 people",
      "51-200": "51 to 200 people",
      "200+": "200+ people",
    },
    integration: {
      bank: "Bank / payments",
      ecommerce: "E-commerce / marketplaces",
      crm: "CRM / sales",
      einvoice: "E-invoicing / EDI",
      none: "Nothing connected",
    },
    pain: {
      manual: "Too much manual work",
      disconnected: "Systems don't talk to each other",
      reporting: "No reliable reporting",
      scaling: "Can't keep up as we grow",
      errors: "Errors, bugs, downtime",
      compliance: "Tax / compliance / e-invoicing headaches",
      support: "Weak support / depends on one person",
      cost: "Licensing / upkeep too expensive",
    },
    metric: {
      manualHours: { lt5: "< 5", "5-15": "5 to 15", "15-40": "15 to 40", "40+": "40+" },
      volume: {
        lt100: "< 100",
        "100-500": "100 to 500",
        "500-2000": "500 to 2,000",
        "2000+": "2,000+",
      },
      closeDays: {
        "1-2": "1 to 2 days",
        "3-5": "3 to 5 days",
        "6-10": "6 to 10 days",
        "10+": "10+ days",
      },
      yesno: { no: "No", yes: "Yes" },
    },
  },

  risks: {
    "legal-ban": {
      title: "1C / BAS are banned in Ukraine",
      what: "Since January 2026, 1C and BAS are under sanctions in Ukraine and are being phased out of business use.",
      why: "Staying on a sanctioned system is a direct legal and operational risk: no legal updates, no official support, and exposure during inspections. A planned migration now is far safer and cheaper than an emergency one later.",
    },
    "legacy-foreign": {
      title: "1C / BAS is the wrong fit for your market",
      what: "1C and BAS are built for the post-Soviet market. In the US and Europe they have almost no local support, partners, or compliance coverage.",
      why: "You're locked into a niche system: hard to hire for, weak local accounting and tax fit, and an isolated ecosystem. A mainstream ERP like Odoo removes that lock-in.",
    },
    spreadsheets: {
      title: "The business runs on spreadsheets",
      what: "Core operations live in Excel or Google Sheets instead of a real system.",
      why: "Nothing holds the real numbers in one place: figures drift, data is easy to break, nothing is automated, and there's no audit trail. It stops scaling the moment the team grows.",
    },
    "sap-overkill": {
      title: "SAP is heavier than you need",
      what: "You run SAP at a company size where its cost and complexity rarely pay off.",
      why: "High licensing and consultant costs, slow changes, and a steep learning curve. A leaner ERP like Odoo covers the same ground at a fraction of the total cost.",
    },
    "quickbooks-outgrown": {
      title: "You've outgrown QuickBooks",
      what: "QuickBooks handles accounting, but your operations, inventory, and sales live outside it.",
      why: "Teams copy data between disconnected tools by hand. A unified ERP ties accounting, sales, inventory, and CRM together and removes the double entry.",
    },
    "no-integrations": {
      title: "Disconnected systems",
      what: "Your core tools (bank, e-commerce, CRM, e-invoicing) aren't connected to each other.",
      why: "People re-key the same data in several places. That's slow, error-prone, and gives you no real-time picture of the business.",
    },
    manual: {
      title: "Too much manual work",
      what: "A lot of routine work is done by hand: re-entering data, copying between tools.",
      why: "Manual work eats hours and creates errors. Most of it can be automated, usually with a fast payback.",
    },
    disconnected: {
      title: "Systems don't talk to each other",
      what: "Your tools work in silos and don't share data automatically.",
      why: "That means duplicate entry, mismatched numbers, and delays. Integration gives you one consistent flow.",
    },
    reporting: {
      title: "You can't trust the numbers",
      what: "Reliable, up-to-date reporting is hard to get out of the current setup.",
      why: "Decisions get made on stale exports or gut feel. Proper reports and dashboards give you real-time, trustworthy figures.",
    },
    scaling: {
      title: "The system can't keep up with growth",
      what: "The current setup struggles as volume and headcount grow.",
      why: "Performance and process gaps get worse with scale: slowdowns, workarounds, and risk. You need a platform with room to grow.",
    },
    errors: {
      title: "Errors, bugs, and downtime",
      what: "Staff hit errors, freezes, or outages in day-to-day work.",
      why: "Downtime stalls the team and can corrupt data. The root causes need to be found and fixed.",
    },
    compliance: {
      title: "Tax and compliance friction",
      what: "Tax, reporting, or e-invoicing requirements are hard to meet with the current system.",
      why: "Compliance gaps risk fines and rework. A properly localized ERP keeps you aligned with local rules.",
    },
    support: {
      title: "Weak support / key-person risk",
      what: "Support is slow, or everything depends on one person who knows the system.",
      why: "If that person leaves, you're stuck. You need maintained software and a support arrangement that doesn't rely on a single individual.",
    },
    cost: {
      title: "Licensing and upkeep cost too much",
      what: "Licenses, maintenance, or consultant fees feel too high for what you get.",
      why: "You may be overpaying for a system that doesn't fit. Open-source Odoo removes per-user license fees and lowers total cost.",
    },
    "odoo-optimize": {
      title: "Untapped Odoo potential",
      what: "You're on Odoo, but parts of it aren't configured or used to their full value.",
      why: "Most Odoo setups leave easy wins on the table: automation, integrations, and reporting that pay back quickly.",
    },
  },

  recommendation: {
    "migrate-urgent": {
      title: "Migrate off 1C / BAS to Odoo, start now",
      body: "1C and BAS are sanctioned in Ukraine as of January 2026, so a move is mandatory, not optional. The safe play is a planned, staged migration to Odoo, the leading replacement for banned 1C/BAS, done calmly now rather than under emergency pressure later. We move your data and processes across with no loss and minimal downtime.",
    },
    migrate: {
      title: "Plan a migration from 1C / BAS to Odoo",
      body: "1C and BAS don't fit the US or European market: limited local support, weak compliance fit, and a closed ecosystem. Odoo is a mainstream, open-source ERP with strong local coverage. We recommend a staged migration that moves your data and day-to-day work onto Odoo without disrupting the business.",
    },
    implement: {
      title: "Implement Odoo as your first real ERP",
      body: "Running on spreadsheets (or no system) is holding you back. We recommend implementing Odoo as one system for sales, accounting, inventory, and operations, configured for your market and rolled out in stages so the team adapts smoothly.",
    },
    replace: {
      title: "Consolidate onto Odoo",
      body: "Your current setup is either heavier and pricier than you need, or too narrow to run the whole business. We recommend consolidating onto Odoo, one open-source platform covering accounting, sales, inventory, and CRM at a far lower total cost, with a staged switch-over.",
    },
    optimize: {
      title: "Optimize and extend your Odoo",
      body: "You're already on the right platform. The opportunity now is to get more out of it: fix what's rough, automate manual steps, connect the tools you use, and add the reports you're missing, all in focused, low-risk improvements.",
    },
  },

  plan: {
    connectVerb: "Connect ",
    integrateFallback:
      "Connect the tools you rely on (bank, e-commerce, CRM, e-invoicing)",
    stages: {
      discovery: {
        title: "Discovery & audit",
        items: [
          "Map your current data, processes, and integrations",
          "Define the scope, modules, and success criteria",
        ],
      },
      audit: {
        title: "Audit your Odoo",
        items: [
          "Review your current Odoo setup, modules, and customizations",
          "Pinpoint the highest-value fixes and quick wins",
        ],
      },
      setup: {
        title: "Odoo setup & configuration",
        items: [
          "Stand up Odoo and configure the modules you need",
          "Apply localization: accounting, tax, and e-invoicing for your country",
        ],
      },
      migrateData: {
        title: "Data migration",
        items: [
          "Move master data and history across with validation",
          "Run Odoo in parallel to confirm the numbers match",
        ],
      },
      implementData: {
        title: "Set up your data",
        items: [
          "Import your products, customers, and opening balances",
          "Replace spreadsheets with structured, validated records",
        ],
      },
      integrate: { title: "Integrations", items: [] as string[] },
      golive: {
        title: "Go-live & training",
        items: [
          "Train your team on the new workflows",
          "Cut over to Odoo with hands-on go-live support",
        ],
      },
      stabilize: {
        title: "Stabilize",
        items: [
          "Find and fix the errors and slow spots",
          "Set up backups, monitoring, and updates",
        ],
      },
      optimize: {
        title: "Automate & extend",
        items: [
          "Automate the manual, repetitive work",
          "Add the reports and dashboards you're missing",
        ],
      },
      support: {
        title: "Support & care",
        items: [
          "Ongoing maintenance, updates, and monitoring",
          "Fast support and continued improvements",
        ],
      },
    },
  },

  packages: [
    {
      id: "implementation",
      name: "Implementation",
      tagline: "Get Odoo live, configured for your market.",
      deliverables: [
        "Needs analysis & process mapping",
        "Odoo setup & module configuration",
        "Localization: accounting, tax & e-invoicing",
        "Data import & migration",
        "Team training & go-live support",
      ],
      priceFrom: 1800,
      priceNote: "typical project €3,000 to €8,000 by scope",
      perMonth: false,
      timeline: "from 3 to 6 weeks",
    },
    {
      id: "custom",
      name: "Custom development",
      tagline: "Tailor Odoo to how you actually work.",
      deliverables: [
        "Custom modules & features",
        "Integrations: bank, marketplaces, CRM, e-invoicing",
        "Workflow automation",
        "Custom reports & dashboards",
        "API & third-party connections",
      ],
      priceFrom: 1200,
      priceNote: "or €45/hr",
      perMonth: false,
      timeline: "from 2 to 4 weeks",
    },
    {
      id: "support",
      name: "Support & care",
      tagline: "Keep Odoo healthy and improving.",
      deliverables: [
        "Maintenance, updates & monitoring",
        "Bug fixes & performance tuning",
        "User support & training",
        "Regular health checks",
        "Ongoing small enhancements",
      ],
      priceFrom: 240,
      perMonth: true,
      timeline: "monthly, ongoing",
    },
  ],
};

const uk: typeof en = {
  ui: {
    brand: "ERP-аудит",
    headerCta: "Почати",
    footerTagline:
      "Odoo ERP: впровадження, доробка та супровід.",
    contactPrefix: "Звʼязок: ",
    toEn: "EN",
    toUk: "УКР",
    homeAria: "На початок",
  },

  intro: {
    badge: "Безкоштовно · Без реєстрації · 2 хвилини",
    h1a: "Аудит вашої системи",
    h1b: "за 2 хвилини",
    sub: "Дайте відповіді на кілька простих питань і отримайте зрозумілий звіт: оцінку стану, головні ризики та рекомендований шлях на базі Odoo.",
    odooNote: "На базі Odoo, ERP з відкритим кодом.",
    ctaStart: "Почати аудит",
    ctaNote: "Звіт зʼявиться одразу на екрані",
    chips: ["2-3 хвилини", "6 коротких кроків", "Зрозумілий звіт"],
    whatYouGetTitle: "Що ви отримаєте",
    getItems: [
      {
        t: "Оцінку стану",
        d: "Одне зрозуміле число від 0 до 100: стан вашої бізнес-системи.",
      },
      {
        t: "Ризики за пріоритетом",
        d: "Що не так і чому це важливо, простими словами.",
      },
      {
        t: "Рекомендований шлях",
        d: "Впроваджувати, мігрувати чи оптимізувати, і які етапи пройти.",
      },
      {
        t: "Вашу вигоду в цифрах",
        d: "Скільки годин і грошей коштує ручна робота, плюс пакети й ціна «від».",
      },
    ],

    whoForTitle: "Кому це підходить",
    whoForLead:
      "Ваша компанія росте, а системи починають вас гальмувати.",
    whoForItems: [
      "Власникам і керівникам операцій у компаніях від 5 до 200 людей.",
      "Командам на таблицях, 1С/BAS, QuickBooks, SAP або наполовину налаштованому Odoo.",
      "Усім, хто втрачає години на ручне введення і цифри, що ніколи не сходяться.",
    ],

    howTitle: "Як це працює",
    howSteps: [
      {
        t: "1. Відповідаєте на 6 коротких питань",
        d: "Про вашу систему, команду і що болить найбільше. Займає 2-3 хвилини.",
      },
      {
        t: "2. Читаєте звіт на екрані",
        d: "Оцінка стану, ризики за пріоритетом, план і вартість ручної роботи.",
      },
      {
        t: "3. Оберіть пакет і почніть",
        d: "Виберіть відповідний пакет, оплатіть безпечно і розкажіть про своє налаштування. Стартуємо за кілька робочих днів.",
      },
    ],

    whyTitle: "Чому я",
    whyItems: [
      {
        t: "Робота senior-рівня, напряму",
        d: "Працюєте напряму з тим, хто робить проєкт. Без акаунт-менеджерів і передач між людьми.",
      },
      {
        t: "Ощадливо, тож швидше і дешевше",
        d: "Чіткий процес без зайвих ланок агенції. Проєкти йдуть швидше і коштують менше.",
      },
      {
        t: "Фіксована ціна, без сюрпризів",
        d: "Чіткий обсяг і фіксована вартість ще до старту. Сума, яку ви погодили, і є сумою до сплати.",
      },
      {
        t: "На відкритому Odoo",
        d: "Без плати за кожного користувача. Одна система для обліку, продажів, складу і CRM.",
      },
    ],

    previewKicker: "Приклад звіту",
    previewScoreLabel: "Оцінка стану",
    previewZone: "Є що покращити",
    previewRisks: [
      { label: "Забагато ручного введення даних", tag: "high" },
      { label: "Системи не зв'язані", tag: "med" },
      { label: "Немає надійних звітів", tag: "low" },
    ],
  },

  quiz: {
    stepWord: "Крок",
    ofWord: "з",
    back: "Назад",
    next: "Далі",
    showReport: "Показати звіт",
    multiHint: "Можна вибрати кілька варіантів",
    steps: {
      system: {
        title: "На якій системі працює ваш бізнес сьогодні?",
        subtitle: "Виберіть основну, у якій працюєте.",
      },
      market: {
        title: "На якому ринку ви працюєте?",
        subtitle: "Де базується бізнес або веде більшість роботи.",
      },
      size: {
        title: "Скільки людей працює в системі?",
        subtitle: "",
      },
      integrations: {
        title: "Що підключено до вашої системи?",
        subtitle: "Відмітьте все, що використовуєте.",
      },
      metrics: {
        title: "Кілька цифр, щоб порахувати вигоду в грошах",
        subtitle:
          "Приблизних оцінок достатньо. Вони живлять розрахунок економії у вашому звіті.",
        manualHoursLabel:
          "Скільки годин на тиждень команда витрачає на ручне введення та звірку даних",
        volumeLabel: "Замовлень або рахунків на місяць",
        closeDaysLabel: "Скільки днів займає закриття місяця",
        doubleEntryLabel: "Чи вводяться одні й ті самі дані у кілька систем?",
      },
      pains: {
        title: "Що болить найбільше зараз?",
        subtitle: "Відмітьте те, що підходить. За бажанням опишіть своїми словами.",
        textLabel: "Опишіть своїми словами (необовʼязково)",
        textPlaceholder:
          "Напр.: закриття місяця займає тиждень, а цифри ніколи не сходяться",
      },
    },
  },

  report: {
    kicker: "ERP-аудит",
    title: "Звіт про ваші бізнес-системи",
    summaryTitle: "Короткий висновок",
    recommendationTitle: "Рекомендований шлях",
    risksTitle: "Виявлені ризики",
    issueOne: "питання",
    issueMany: "питань",
    noRisks:
      "За анкетою явних проблем не видно, і це добрий знак. Точну картину покаже коротка перевірка після старту.",
    planTitle: "Рекомендований план",
    packagesTitle: "Що ви отримаєте",
    packagesIntro:
      "Три формати співпраці. Оберіть свій або поєднайте їх. Ціни в євро.",
    recommendedBadge: "Рекомендовано для вас",
    priceLabel: "Орієнтовна ціна",
    timelineLabel: "Строки",
    fromWord: "від",
    perMonthWord: "/міс",
    estimateNote:
      "Цифри орієнтовні. Точний обсяг і фіксовану вартість узгодимо з вами письмово ще до початку робіт.",
    trustLine:
      "Ощадлива, пряма студія. Без націнок агенцій і посередників. Робота senior-рівня, тож ви платите менше.",
    subScoresTitle: "Де ви зараз, за напрямами",
    subScoreLabels: {
      data: "Дані та інтеграції",
      automation: "Автоматизація",
      compliance: "Відповідність і ризики",
      cost: "Економність",
    },
    impactKicker: "Вигода в цифрах",
    impactTitle: "У скільки вам обходиться ручна робота",
    impactEstimate: "Орієнтовно",
    impactHoursLabel: "Втрачено на ручну роботу",
    impactHoursUnit: "годин / місяць",
    impactCostLabel: "Вартість цього часу",
    impactCostUnit: "/ місяць",
    impactSaveLabel: "Можна повернути з Odoo",
    impactSaveUnit: "/ рік",
    impactSaveSub: "Близько {hours} годин і {cost} назад щомісяця",
    impactAssumption:
      "Лише орієнтовно. З розрахунку близько {rate}/год повної вартості праці та автоматизації Odoo, що прибирає близько {pct}% цієї ручної роботи. Ваші реальні цифри уточнимо, коли визначимо обсяг робіт.",
    benchmarkKicker: "Орієнтир",
    benchmarkBase:
      "Бізнеси вашого розміру, що переходять на Odoo, зазвичай скорочують ручне введення даних на 40-60% і зводять банк, продажі, склад і рахунки в одну зв'язану систему.",
    benchmarkClose:
      " А ще скорочують закриття місяця з {days} до кількох днів.",
    sev: {
      high: "Високий пріоритет",
      med: "Середній пріоритет",
      low: "Низький пріоритет",
    },
    zone: { green: "Здорова система", amber: "Є що покращити", red: "Потребує уваги" },
    verdict: {
      green: "Система в непоганій формі. Є точкові покращення.",
      amber:
        "Працює, але накопичились проблеми, які гальмують і створюють ризики.",
      red: "Тут є серйозні ризики. Варто зайнятися ними найближчим часом.",
    },
    ctaTitle: "Готові почати?",
    ctaBody:
      "Виберіть відповідний пакет, оплатіть безпечно і розкажіть про своє налаштування. Ви бачите чіткий статус на кожному кроці, від старту до результату.",
    // Lead capture
    leadKicker: "Отримайте письмово",
    leadTitle: "Надішліть мені звіт і фіксовану ціну",
    leadBody:
      "Залиште e-mail. Я надішлю повний звіт і фіксовану ціну саме під вашу ситуацію, без зайвого листування. Більшість починають із Супроводу, €240/міс, скасувати можна будь-коли.",
    leadPlaceholder: "you@company.com",
    leadButton: "Надіслати мені",
    leadSending: "Надсилаємо",
    leadDoneTitle: "Вже летить",
    leadDoneBody:
      "Незабаром перевірте пошту. Повний звіт і фіксована ціна вже в дорозі до вас.",
    leadError: "Не вдалося надіслати. Напишіть мені напряму: ",
    leadErrorLink: "надіслати лист",
    leadSubject: "New lead - report",
    // Easy-entry emphasis
    easyKicker: "Найпростіший старт",
    easyTitle: "Почніть із Супроводу, €240/міс",
    easyBody:
      "Найпростіший перший крок. Скасувати можна будь-коли. Я тримаю ваш Odoo здоровим, а більшу роботу беремо далі. Жодних довгих зобовʼязань на старті.",
    easyCta: "Почати із Супроводу",
    print: "Друк / зберегти PDF",
    restart: "Пройти аудит знову",
  },

  buy: {
    getStarted: "Почати",
    startBtn: "Почати",
    startCtaNote: "Безпечна оплата. Доступний банківський переказ.",
    cancelAnytime: "Скасувати будь-коли",
    startWithSupport: "Почати із Супроводу",
    modalKicker: "Що буде далі",
    chooseKicker: "Оберіть свій план",
    chooseTitle: "Почніть легко, зростайте згодом",
    chooseSub: "Три способи почати. Змінюйте чи додавайте будь-коли.",
    startHere: "Почніть звідси",
    chooseBtn: "Обрати",
    changePlan: "Змінити план",
    perMonth: "/міс",
    steps: [
      {
        t: "Оберіть пакет і оплатіть",
        d: "Оплатіть безпечно через PayPal або запросіть банківський переказ.",
      },
      {
        t: "Розкажіть про своє налаштування",
        d: "Коротка форма, щоб ми швидко стартували.",
      },
      {
        t: "Починаємо за кілька робочих днів",
        d: "Ваш проєкт ставимо в роботу й розпочинаємо.",
      },
      {
        t: "Ви отримуєте результат",
        d: "З чітким статусом протягом усього шляху.",
      },
    ],
    payTitle: "Оберіть пакет і оплатіть",
    oneTimeNote: "Разова оплата для старту.",
    subNote: "Щомісячний план. Скасувати можна будь-коли.",
    payLoading: "Завантажуємо безпечну оплату...",
    paypalUnconfigured:
      "Оплата карткою та через PayPal завершує налаштування. Скористайтесь банківським переказом нижче, щоб почати вже зараз.",
    payWithLink: "Сплатити через PayPal",
    paidTitle: "Оплату отримано",
    paidBody:
      "Дякуємо. Тепер розкажіть про своє налаштування нижче, щоб ми почали.",
    paidSubject: "Оплату отримано",
    bankToggle: "Сплатити банківським переказом",
    bankIntro:
      "Зручніше банківським переказом? Запросіть реквізити, і ми надішлемо їх вам на пошту.",
    bankHow:
      "Ви залишаєте запит, ми надсилаємо реквізити, ви робите переказ, ми підтверджуємо і починаємо.",
    bankName: "Як до вас звертатися",
    bankEmail: "E-mail",
    bankCompany: "Компанія",
    bankSubmit: "Запросити реквізити",
    bankSubmitting: "Надсилаємо",
    bankSubject: "Запит на банківський переказ",
    intakeTitle: "Розкажіть про своє налаштування",
    intakeSubtitle: "Кілька деталей, щоб ми швидко стартували. Займе хвилину.",
    fCompany: "Компанія",
    fCompanyPh: "Назва компанії",
    fSystem: "Поточна система",
    fSystemPh: "напр. таблиці, 1С, QuickBooks, SAP",
    fGoal: "Головна мета або що болить найбільше",
    fGoalPh: "Що найбільше хочете виправити чи досягти",
    fName: "Як до вас звертатися",
    fNamePh: "Імʼя",
    fEmail: "E-mail",
    fEmailPh: "you@company.com",
    intakeSubmit: "Надіслати дані",
    intakeSubmitting: "Надсилаємо",
    intakeSubject: "Нова заявка на старт",
    errorPrefix: "Не вдалося надіслати. Напишіть напряму: ",
    errorLink: "надіслати лист",
    doneTitle: "Усе готово",
    doneBody:
      "Дякуємо. Ми отримали ваші дані і незабаром звʼяжемося з наступним кроком. Ви матимете чіткий статус протягом усього шляху.",
    close: "Закрити",
  },

  labels: {
    system: {
      odoo: "Odoo",
      "1c": "1С",
      bas: "BAS",
      quickbooks: "QuickBooks",
      sap: "SAP",
      spreadsheets: "Таблиці (Excel / Google Sheets)",
      other: "Інша / самописна система",
    },
    systemHint: {
      odoo: "ERP з відкритим кодом",
      "1c": "Застаріла ERP / облік",
      bas: "На базі 1С, поширена в Україні",
      quickbooks: "Бухгалтерська програма",
      sap: "Корпоративна ERP",
      spreadsheets: "Поки що без системи",
      other: "Або не впевнені",
    },
    market: { us: "США", eu: "Європа", ua: "Україна", other: "Інша країна" },
    size: {
      "1-5": "1-5 осіб",
      "6-20": "6-20 осіб",
      "21-50": "21-50 осіб",
      "51-200": "51-200 осіб",
      "200+": "200+ осіб",
    },
    integration: {
      bank: "Банк / платежі",
      ecommerce: "E-commerce / маркетплейси",
      crm: "CRM / продажі",
      einvoice: "Е-документообіг (ЕДО)",
      none: "Нічого не підключено",
    },
    pain: {
      manual: "Багато ручної роботи",
      disconnected: "Системи не зв'язані між собою",
      reporting: "Немає надійних звітів",
      scaling: "Система не встигає за зростанням",
      errors: "Помилки, збої, простої",
      compliance: "Складнощі з податками / звітністю / ЕДО",
      support: "Слабка підтримка / залежність від однієї людини",
      cost: "Дорогі ліцензії / обслуговування",
    },
    metric: {
      manualHours: { lt5: "< 5", "5-15": "5-15", "15-40": "15-40", "40+": "40+" },
      volume: {
        lt100: "< 100",
        "100-500": "100-500",
        "500-2000": "500-2 000",
        "2000+": "2 000+",
      },
      closeDays: {
        "1-2": "1-2 дні",
        "3-5": "3-5 днів",
        "6-10": "6-10 днів",
        "10+": "10+ днів",
      },
      yesno: { no: "Ні", yes: "Так" },
    },
  },

  risks: {
    "legal-ban": {
      title: "1С / BAS заборонені в Україні",
      what: "З січня 2026 року 1С і BAS під санкціями в Україні, і їх поступово виводять із бізнес-використання.",
      why: "Залишатися на санкційній системі це прямий юридичний і операційний ризик: немає легальних оновлень, офіційної підтримки, є ризик під час перевірок. Планова міграція зараз значно безпечніша й дешевша, ніж екстрена потім.",
    },
    "legacy-foreign": {
      title: "1С / BAS не підходять для вашого ринку",
      what: "1С і BAS створені для пострадянського ринку. У США та Європі вони майже не мають місцевої підтримки, партнерів і відповідності законодавству.",
      why: "Ви прив'язані до нішевої системи: важко знайти фахівців, слабка відповідність місцевому обліку й податкам, ізольована екосистема. Поширена ERP на кшталт Odoo знімає цю залежність.",
    },
    spreadsheets: {
      title: "Бізнес тримається на таблицях",
      what: "Ключові операції живуть в Excel або Google Sheets замість реальної системи.",
      why: "Немає єдиного місця з реальними цифрами: дані розходяться, їх легко зіпсувати, нічого не автоматизовано, немає історії змін. Це перестає масштабуватися щойно команда зростає.",
    },
    "sap-overkill": {
      title: "SAP важчий, ніж вам потрібно",
      what: "Ви працюєте на SAP за розміру компанії, де його вартість і складність рідко окуповуються.",
      why: "Високі витрати на ліцензії й консультантів, повільні зміни, складне навчання. Легша ERP як Odoo покриває те саме за частку від загальної вартості.",
    },
    "quickbooks-outgrown": {
      title: "Ви переросли QuickBooks",
      what: "QuickBooks веде бухгалтерію, але операції, склад і продажі живуть поза ним.",
      why: "Команди вручну переносять дані між роз'єднаними інструментами. Єдина ERP зв'язує облік, продажі, склад і CRM разом і прибирає подвійне введення.",
    },
    "no-integrations": {
      title: "Роз'єднані системи",
      what: "Ваші ключові інструменти (банк, e-commerce, CRM, ЕДО) не зв'язані між собою.",
      why: "Люди вводять ті самі дані в кількох місцях. Це повільно, з помилками і не дає реальної картини бізнесу в моменті.",
    },
    manual: {
      title: "Забагато ручної роботи",
      what: "Багато рутини роблять руками: переносять дані, копіюють між інструментами.",
      why: "Ручна робота з'їдає години й породжує помилки. Більшість можна автоматизувати, зазвичай зі швидкою окупністю.",
    },
    disconnected: {
      title: "Системи не зв'язані між собою",
      what: "Ваші інструменти працюють окремо й не обмінюються даними автоматично.",
      why: "Це означає подвійне введення, розбіжності в цифрах і затримки. Інтеграція дає єдиний узгоджений потік.",
    },
    reporting: {
      title: "Цифрам не можна довіряти",
      what: "Надійну й актуальну звітність важко отримати з поточної системи.",
      why: "Рішення приймають за застарілими вивантаженнями або «на відчуття». Нормальні звіти й дашборди дають достовірні цифри в реальному часі.",
    },
    scaling: {
      title: "Система не встигає за зростанням",
      what: "Поточна система ледь тримається, коли зростають обсяги й кількість людей.",
      why: "Зі зростанням проблеми продуктивності й процесів лише посилюються: гальмування, костилі, ризики. Потрібна платформа із запасом.",
    },
    errors: {
      title: "Помилки, збої та простої",
      what: "Співробітники стикаються з помилками, зависаннями чи простоями в роботі.",
      why: "Простої гальмують команду й можуть псувати дані. Потрібно знайти й усунути причини.",
    },
    compliance: {
      title: "Складнощі з податками й відповідністю",
      what: "Вимоги щодо податків, звітності чи ЕДО важко виконувати поточною системою.",
      why: "Прогалини у відповідності загрожують штрафами й переробками. Правильно локалізована ERP тримає вас у межах місцевих правил.",
    },
    support: {
      title: "Слабка підтримка / залежність від однієї людини",
      what: "Підтримка повільна, або все тримається на одній людині, яка знає систему.",
      why: "Якщо ця людина піде, ви застрягли. Потрібне підтримуване ПЗ і супровід, що не залежить від однієї особи.",
    },
    cost: {
      title: "Ліцензії й обслуговування надто дорогі",
      what: "Ліцензії, обслуговування чи послуги консультантів здаються завеликими за те, що ви отримуєте.",
      why: "Можливо, ви переплачуєте за систему, що не підходить. Open-source Odoo прибирає плату за кожного користувача й знижує загальну вартість.",
    },
    "odoo-optimize": {
      title: "Невикористаний потенціал Odoo",
      what: "Ви на Odoo, але частина можливостей не налаштована або не використовується повністю.",
      why: "Більшість впроваджень Odoo лишають прості виграші на столі: автоматизацію, інтеграції та звітність, що швидко окуповуються.",
    },
  },

  recommendation: {
    "migrate-urgent": {
      title: "Мігрувати з 1С / BAS на Odoo, починати зараз",
      body: "1С і BAS під санкціями в Україні з січня 2026 року, тож перехід обов'язковий, а не за бажанням. Безпечний варіант: планова поетапна міграція на Odoo, головна заміна заборонених 1С/BAS, спокійно зараз, а не в авральному режимі потім. Ми переносимо ваші дані й процеси без втрат і з мінімальним простоєм.",
    },
    migrate: {
      title: "Спланувати міграцію з 1С / BAS на Odoo",
      body: "1С і BAS не підходять для ринку США та Європи: обмежена місцева підтримка, слабка відповідність і закрита екосистема. Odoo є поширеною ERP з відкритим кодом і сильним місцевим покриттям. Рекомендуємо поетапну міграцію, що переносить ваші дані й щоденну роботу на Odoo без зупинки бізнесу.",
    },
    implement: {
      title: "Впровадити Odoo як вашу першу справжню ERP",
      body: "Робота на таблицях (або без системи) стримує вас. Рекомендуємо впровадити Odoo як єдину систему для продажів, обліку, складу й операцій, налаштовану під ваш ринок і запущену поетапно, щоб команда звикала плавно.",
    },
    replace: {
      title: "Зібрати все в Odoo",
      body: "Поточна система або важча й дорожча, ніж потрібно, або надто вузька, щоб вести весь бізнес. Рекомендуємо консолідацію на Odoo: одну open-source платформу для обліку, продажів, складу й CRM за значно нижчу загальну вартість, з поетапним переходом.",
    },
    optimize: {
      title: "Оптимізувати й розширити ваш Odoo",
      body: "Ви вже на правильній платформі. Тепер можливість отримати від неї більше: виправити шорсткості, автоматизувати ручні кроки, підключити ваші інструменти й додати потрібні звіти, усе невеликими, малоризиковими кроками.",
    },
  },

  plan: {
    connectVerb: "Підключити ",
    integrateFallback:
      "Підключити потрібні інструменти (банк, e-commerce, CRM, ЕДО)",
    stages: {
      discovery: {
        title: "Обстеження та аудит",
        items: [
          "Скласти карту ваших даних, процесів та інтеграцій",
          "Визначити обсяг, модулі й критерії успіху",
        ],
      },
      audit: {
        title: "Аудит вашого Odoo",
        items: [
          "Переглянути поточне налаштування, модулі й доробки Odoo",
          "Визначити найцінніші виправлення та швидкі виграші",
        ],
      },
      setup: {
        title: "Налаштування Odoo",
        items: [
          "Розгорнути Odoo й налаштувати потрібні модулі",
          "Застосувати локалізацію: облік, податки та ЕДО для вашої країни",
        ],
      },
      migrateData: {
        title: "Міграція даних",
        items: [
          "Перенести довідники й історію з перевіркою",
          "Запустити Odoo паралельно, щоб звірити цифри",
        ],
      },
      implementData: {
        title: "Налаштування даних",
        items: [
          "Імпортувати товари, клієнтів і початкові залишки",
          "Замінити таблиці структурованими, перевіреними записами",
        ],
      },
      integrate: { title: "Інтеграції", items: [] as string[] },
      golive: {
        title: "Запуск і навчання",
        items: [
          "Навчити команду новим процесам",
          "Перейти на Odoo з підтримкою на старті",
        ],
      },
      stabilize: {
        title: "Стабілізація",
        items: [
          "Знайти й усунути помилки та повільні місця",
          "Налаштувати резервні копії, моніторинг та оновлення",
        ],
      },
      optimize: {
        title: "Автоматизація й розвиток",
        items: [
          "Автоматизувати ручну, повторювану роботу",
          "Додати звіти й дашборди, яких бракує",
        ],
      },
      support: {
        title: "Супровід",
        items: [
          "Постійне обслуговування, оновлення й моніторинг",
          "Швидка підтримка й подальші покращення",
        ],
      },
    },
  },

  packages: [
    {
      id: "implementation",
      name: "Впровадження",
      tagline: "Запустити Odoo, налаштований під ваш ринок.",
      deliverables: [
        "Аналіз потреб і опис процесів",
        "Розгортання Odoo й налаштування модулів",
        "Локалізація: облік, податки та ЕДО",
        "Імпорт і міграція даних",
        "Навчання команди й підтримка на старті",
      ],
      priceFrom: 1800,
      priceNote: "типовий проєкт €3 000 до €8 000 залежно від обсягу",
      perMonth: false,
      timeline: "від 3 до 6 тижнів",
    },
    {
      id: "custom",
      name: "Доробка під вас",
      tagline: "Налаштувати Odoo під те, як ви реально працюєте.",
      deliverables: [
        "Власні модулі й функції",
        "Інтеграції: банк, маркетплейси, CRM, ЕДО",
        "Автоматизація процесів",
        "Власні звіти й дашборди",
        "API та сторонні підключення",
      ],
      priceFrom: 1200,
      priceNote: "або €45/год",
      perMonth: false,
      timeline: "від 2 до 4 тижнів",
    },
    {
      id: "support",
      name: "Супровід і турбота",
      tagline: "Тримати Odoo здоровим і таким, що розвивається.",
      deliverables: [
        "Обслуговування, оновлення й моніторинг",
        "Виправлення помилок і тюнінг продуктивності",
        "Підтримка користувачів і навчання",
        "Регулярні перевірки стану",
        "Постійні невеликі покращення",
      ],
      priceFrom: 240,
      perMonth: true,
      timeline: "щомісяця, постійно",
    },
  ],
};

export const STR: Record<Lang, typeof en> = { en, uk };
export type Str = typeof en;

/* Build the report summary sentence per language (count-aware). */
export function summarize(lang: Lang, n: number, high: number): string {
  if (lang === "uk") {
    if (n === 0) return STR.uk.report.noRisks;
    const hi = high > 0 ? `, з них критичних: ${high}` : "";
    return `Ми виявили проблемних зон: ${n}${hi}. Рекомендований план нижче враховує вашу ситуацію.`;
  }
  if (n === 0) return STR.en.report.noRisks;
  const issue = n === 1 ? "issue" : "issues";
  const hi = high > 0 ? `, ${high} of them high priority` : "";
  return `We flagged ${n} ${issue}${hi}. The recommended path below is built around your situation.`;
}

/* Currency formatting. EUR across both languages (Europe-first). */
export function formatEur(n: number): string {
  return "€" + n.toLocaleString("en-US");
}

/* ---- Language context ---- */
export const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "en", setLang: () => {} });

export function useLang() {
  return useContext(LangCtx);
}

export function useStr(): Str {
  return STR[useContext(LangCtx).lang];
}
