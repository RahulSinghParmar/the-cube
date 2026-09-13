import { useRef, useState } from "react";

export const learningScope = location.pathname.replace(/[^/]*$/, "");
export function downloadRecord(value: unknown, filename: string, raw = false) {
  const url = URL.createObjectURL(
    new Blob([raw ? String(value) : JSON.stringify(value, null, 2)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function useLearningStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T,
) {
  const [initial] = useState(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
      return {
        value: raw ? validate(JSON.parse(raw)) : fallback,
        error: "",
        blocked: false,
        raw,
      };
    } catch {
      return {
        value: fallback,
        error:
          "Saved data could not be read. The original record has not been overwritten.",
        blocked: true,
        raw,
      };
    }
  });
  const [value, setValue] = useState(initial.value),
    [error, setError] = useState(initial.error);
  const blocked = useRef(initial.blocked),
    current = useRef(value),
    lastSaved = useRef(initial.raw);
  current.current = value;
  function save(next: T) {
    current.current = next;
    setValue(next);
    if (blocked.current) {
      setError(
        "The unreadable saved record is preserved. Download it before explicitly replacing it.",
      );
      return;
    }
    try {
      if (localStorage.getItem(key) !== lastSaved.current) {
        setError(
          "This record changed in another tab. Download your on-screen work or reload the saved record before continuing.",
        );
        return;
      }
      const safe = validate(next),
        raw = JSON.stringify(safe);
      localStorage.setItem(key, raw);
      lastSaved.current = raw;
      setError("");
    } catch {
      setError(
        "Progress is only in memory: local saving failed. Retry or download a backup before leaving.",
      );
    }
  }
  return {
    value,
    error,
    save,
    blocked: blocked.current,
    retry: () => save(current.current),
    backup: () =>
      downloadRecord(
        blocked.current && initial.raw ? initial.raw : current.current,
        "the-cube-learning-backup.json",
        Boolean(blocked.current && initial.raw),
      ),
    replace: () => {
      if (
        window.confirm(
          "Replace only this unreadable learning record with the current on-screen progress? Your simulator and timer data are unaffected.",
        )
      ) {
        blocked.current = false;
        save(current.current);
      }
    },
    restore: async (file: File | undefined) => {
      if (!file) return false;
      try {
        if (file.size > 512000) throw new Error("Backup is too large.");
        const restored = validate(JSON.parse(await file.text()));
        if (
          window.confirm(
            "Restore this backup over the current learning record? Your original simulator and timer are unaffected.",
          )
        ) {
          blocked.current = false;
          save(restored);
          return true;
        }
      } catch {
        setError(
          "This backup could not be verified. The saved record is unchanged.",
        );
      }
      return false;
    },
  };
}
export function RestoreLearning({
  restore,
}: {
  restore: (file: File | undefined) => Promise<unknown>;
}) {
  return (
    <label className="file-button">
      Restore backup
      <input
        type="file"
        aria-label="Restore learning backup"
        accept=".json,application/json"
        onChange={(event) => {
          void restore(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}
export function SaveRecovery({
  store,
}: {
  store: {
    error: string;
    blocked: boolean;
    retry: () => void;
    backup: () => void;
    replace: () => void;
  };
}) {
  return store.error ? (
    <div className="error" role="alert">
      <p>{store.error}</p>
      <div className="actions">
        <button className="secondary" onClick={store.backup}>
          Download preserved record
        </button>
        {store.blocked ? (
          <button className="secondary" onClick={store.replace}>
            Replace unreadable record
          </button>
        ) : (
          <button className="secondary" onClick={store.retry}>
            Retry saving
          </button>
        )}
      </div>
    </div>
  ) : null;
}
