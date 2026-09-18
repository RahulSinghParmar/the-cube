import { messages } from "./messages";
import { MenuIcon } from "./MenuIcon";

type Text = typeof messages.en;
export type Section = "algorithms" | "training" | "guides" | "statistics";

export function sections(text: Text) {
  return [
    {
      title: text.algorithms,
      href: "#/algorithms",
      icon: "cube",
      description: text.algorithmsNote,
    },
    {
      title: text.training,
      href: "#/training",
      icon: "solve",
      description: text.trainingNote,
    },
    {
      title: text.guides,
      href: "#/guides",
      icon: "learn",
      description: text.guidesNote,
    },
    {
      title: text.solve,
      href: "#/solve",
      icon: "solve",
      description: text.solveNote,
    },
    {
      title: text.practice,
      href: "#/play",
      icon: "cube",
      description: text.practiceNote,
    },
    {
      title: text.timer,
      href: "timer.html",
      icon: "timer",
      description: text.timerNote,
    },
    {
      title: text.statistics,
      href: "#/statistics",
      icon: "trophy",
      description: text.statisticsNote,
    },
    {
      title: text.settings,
      href: "#/settings",
      icon: "settings",
      description: text.settingsNote,
    },
  ];
}

const childSections: Record<string, { parent: Section; title: string }> = {
  "#/explore": { parent: "guides", title: "Move explorer" },
  "#/train": { parent: "training", title: "PLL" },
  "#/oll": { parent: "training", title: "OLL" },
  "#/f2l": { parent: "training", title: "F2L" },
  "#/recognize": { parent: "training", title: "PLL recognition" },
  "#/learn": { parent: "guides", title: "Beginner lessons" },
};

export function SectionNavigation({
  route,
  text,
}: {
  route: string;
  text: Text;
}) {
  const child = childSections[route];
  const current = child
    ? text[child.parent]
    : sections(text).find((item) => item.href === route)?.title;
  return (
    <div className="section-navigation">
      <div className="section-trail">
        {child ? (
          <>
            <a href={`#/${child.parent}`}>← {current}</a>
            <span aria-hidden="true">/</span>
            <span>{child.title}</span>
          </>
        ) : (
          <span>{current ?? text.menu}</span>
        )}
      </div>
      <details
        className="section-switcher"
        key={route}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary>{text.allSections}</summary>
        <nav aria-label={text.allSections}>
          {sections(text).map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.href === route ? "page" : undefined}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </details>
    </div>
  );
}

type Card = {
  title: string;
  note: string;
  href: string;
  meta: string;
  icon: string;
};
const collections: Card[] = [
  {
    title: "F2L",
    meta: "12 beginner setups",
    note: "Pair a corner and edge, then insert them together. Start with simple insertions.",
    href: "#/f2l",
    icon: "cube",
  },
  {
    title: "OLL",
    meta: "57 cases",
    note: "Make the top face one color. Browse patterns, compare pieces and replay the moves.",
    href: "#/oll",
    icon: "cube",
  },
  {
    title: "PLL",
    meta: "21 cases",
    note: "Move the last-layer pieces into their places. Compare side colors to identify a case.",
    href: "#/train",
    icon: "cube",
  },
];
const content: Record<
  Section,
  { title: string; intro: string; cards: Card[]; tip: string }
> = {
  algorithms: {
    title: "A pattern. A sequence. A solution.",
    intro:
      "Choose a collection to explore its cases, explanations and 3D playback. Learn what the moves do before practicing them.",
    cards: collections,
    tip: "F2L = first two layers · OLL = orient the last layer · PLL = permute the last layer. F2L currently covers 12 guided beginner setups, not the complete case collection.",
  },
  training: {
    title: "Turn understanding into practice.",
    intro:
      "Choose what to work on today. Guided moves build familiarity; recognition drills help you spot the pattern.",
    cards: [
      {
        title: "PLL recognition",
        meta: "Randomized · optional timing",
        note: "Identify the case before revealing the answer. Review your accuracy and saved history.",
        href: "#/recognize",
        icon: "solve",
      },
      ...collections.map((item) => ({
        ...item,
        title: `${item.title} guided practice`,
        note: `${item.note} Choose Practice moves to complete a guided repetition.`,
      })),
    ],
    tip: "Watching an algorithm does not count as a practice repetition. Each trainer keeps its own progress so you can return where you left off.",
  },
  guides: {
    title: "Start with one move.",
    intro:
      "New to cubing? Begin with the lessons, then explore how pairs fit together. Go at your own pace.",
    cards: [
      {
        title: "Beginner lessons",
        meta: "Start here · 8 guided exercises",
        note: "Learn notation and solving ideas with prepared examples, step-by-step playback and saved progress.",
        href: "#/learn",
        icon: "learn",
      },
      {
        title: "Move explorer",
        meta: "2×2 · 3×3 · 4×4 · 5×5",
        note: "See each turn in 3D. Play, pause, rewind or drag the timeline, with plain-language move explanations.",
        href: "#/explore",
        icon: "cube",
      },
      {
        title: "Understand F2L",
        meta: "Your next step",
        note: "See how a corner and edge form a pair. Follow short explanations through 12 beginner setups.",
        href: "#/f2l",
        icon: "cube",
      },
      {
        title: "Help with your own cube",
        meta: "Manual 3×3 input",
        note: "Enter the colors on your cube, check the state and follow a verified solution. This is a solving tool, separate from the prepared lessons.",
        href: "#/solve",
        icon: "solve",
      },
    ],
    tip: "Keep U on top and F in front when following a lesson. The current exercises use prepared starting states; they are not yet a complete first-solve course.",
  },
  statistics: {
    title: "See how far you have come.",
    intro:
      "Choose the progress you want to review. Physical solves, touch-cube scores and training results stay separate.",
    cards: [
      {
        title: "Physical-cube statistics",
        meta: "Sessions · averages · history",
        note: "Review your selected timer session, personal best, averages and individual attempts. Change sessions on the timer page.",
        href: "timer.html#stats-title",
        icon: "timer",
      },
      {
        title: "Cube statistics",
        meta: "Original simulator",
        note: "Open the original trophy view with your best times and averages for the touch cube.",
        href: "./?panel=stats&return=statistics",
        icon: "trophy",
      },
      {
        title: "Recognition history",
        meta: "PLL · accuracy and timing",
        note: "Review saved recognition results and previous drill rounds.",
        href: "#/recognize",
        icon: "solve",
      },
      {
        title: "Guided practice progress",
        meta: "F2L · OLL · PLL",
        note: "Choose a trainer to see practiced cases, repetitions and your unfinished guided attempt.",
        href: "#/training",
        icon: "learn",
      },
    ],
    tip: "Your records live in this browser. Timer backups and learning/training backups remain available in their original screens.",
  },
};

export function SectionPage({
  section,
  text,
}: {
  section: Section;
  text: Text;
}) {
  const page = content[section];
  return (
    <div className="section-page">
      <div className="section-heading-copy">
        <p className="eyebrow">THE CUBE / {text[section]}</p>
        <h1 tabIndex={-1}>{page.title}</h1>
        <p>{page.intro}</p>
      </div>
      <section className="section-cards" aria-label={text[section]}>
        {page.cards.map((card) => (
          <a
            className="section-card"
            href={card.href}
            key={card.href}
            aria-label={card.title}
          >
            <div className="section-card-top">
              <span
                className={`tool-icon icon-${card.icon}`}
                aria-hidden="true"
              >
                <MenuIcon kind={card.icon} />
              </span>
              <span className="section-card-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <p className="section-meta">{card.meta}</p>
            <h2>{card.title}</h2>
            <p>{card.note}</p>
          </a>
        ))}
      </section>
      <aside className="section-note">
        <p>{page.tip}</p>
      </aside>
      {section === "algorithms" && (
        <p className="section-next">
          <a href="#/guides">New to notation? Open Guides →</a>
          <a href="#/training">Ready to practice? Open Training →</a>
        </p>
      )}
      {section === "statistics" && (
        <p className="section-next">
          <a href="timer.html#data-title">Timer backups →</a>
          <a href="#/learn">Lesson progress →</a>
        </p>
      )}
    </div>
  );
}
