import { useEffect, useRef, useState } from "react";
import { messages } from "./messages";
import { sections } from "./Sections";
import "./tool-search.css";

type Text = typeof messages.en;
type Destination = { title: string; href: string; description: string; aliases?: string };

function destinations(text: Text): Destination[] {
  return [
    ...sections(text),
    { title: "Beginner lessons", href: "#/learn", description: "Eight guided 3×3 exercises with saved progress.", aliases: "learn tutorial notation first solve basics" },
    { title: "F2L guided practice", href: "#/f2l", description: "Pair and insert corners and edges: 12 beginner setups.", aliases: "first two layers algorithms" },
    { title: "OLL guided practice", href: "#/oll", description: "Explore and practice all 57 orientation cases.", aliases: "orient last layer algorithms" },
    { title: "PLL guided practice", href: "#/train", description: "Explore and practice all 21 permutation cases.", aliases: "permute last layer algorithms" },
    { title: "PLL recognition", href: "#/recognize", description: "Identify patterns and review saved accuracy and history.", aliases: "quiz drill results training" },
    { title: "Cube settings", href: "./?panel=settings&return=settings", description: "Open the original simulator settings directly.", aliases: "legacy touch cube appearance" },
    { title: "Cube statistics", href: "./?panel=stats&return=statistics", description: "Original trophy view: best times and averages.", aliases: "legacy stats achievements records" },
    { title: "Physical-cube statistics", href: "timer.html#stats-title", description: "Session times, averages and personal bests.", aliases: "stats history records ao5 ao12" },
    { title: "Timer backups", href: "timer.html#data-title", description: "Export or restore your physical-cube history.", aliases: "import data recovery sessions" },
    { title: text.about, href: "#/about", description: "About this project and its developer.", aliases: "rahul information" },
    { title: text.license, href: "#/license", description: "Project license and third-party notices.", aliases: "credits attribution sources" },
  ];
}

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/×/g, "x").trim();
}

export function ToolSearch({ route, text }: { route: string; text: Text }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = destinations(text).filter(item => {
    const content = normalize(`${item.title} ${item.description} ${item.aliases ?? ""}`);
    return words.every(word => content.includes(word));
  });

  function open(opener?: HTMLElement | null) {
    if (document.querySelector("dialog[open]")) return;
    returnFocus.current = opener ?? (document.activeElement as HTMLElement);
    setQuery("");
    dialog.current?.showModal();
    input.current?.focus();
  }
  function dismiss() {
    dialog.current?.close();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  }
  useEffect(() => {
    dialog.current?.close();
  }, [route]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey &&
          event.key.toLowerCase() === "k" && !event.isComposing) {
        if (document.querySelector("dialog[open]")) return;
        event.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  return (
    <div className="tool-search-launcher">
      <button ref={trigger} type="button" className="tool-search-trigger" onClick={() => open(trigger.current)}
        aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
        </svg>
        {text.searchTools}
      </button>
      <dialog ref={dialog} className="tool-search-dialog" aria-labelledby="tool-search-title"
        onCancel={event => { event.preventDefault(); dismiss(); }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            dismiss();
            return;
          }
          const links = Array.from(results.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (!links.length) return;
            event.preventDefault();
            const index = links.indexOf(document.activeElement as HTMLAnchorElement);
            const next = event.key === "ArrowDown" ? (index + 1) % links.length : (index <= 0 ? links.length - 1 : index - 1);
            links[next]?.focus();
          } else if (event.key === "Enter" && event.target === input.current) {
            event.preventDefault();
            links[0]?.click();
          }
        }}>
        <div className="tool-search-heading">
          <h2 id="tool-search-title">{text.searchTools}</h2>
          <button type="button" onClick={dismiss} aria-label={text.closeSearch}>×</button>
        </div>
        <label className="tool-search-label" htmlFor="tool-search-input">{text.searchLabel}</label>
        <input ref={input} id="tool-search-input" type="search" value={query} maxLength={120}
          autoComplete="off" placeholder={text.searchPlaceholder}
          onChange={event => setQuery(event.target.value)} />
        <p className="tool-search-count" role="status" aria-live="polite">{matches.length ? `${matches.length} ${text.searchResults}` : text.searchEmpty}</p>
        <ul ref={results} className="tool-search-results" aria-label={text.searchResults}>
          {matches.map(item => (
            <li key={item.href}>
              <a href={item.href} onClick={event => {
                if (!event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
                  dialog.current?.close();
              }}>
                <strong>{item.title}</strong><span>{item.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
