import {
  algorithmChunks,
  defaultCasePreference,
  defaultNotation,
  libraryCase,
  newLibraryProgress,
  validateLibraryProgress,
  RATINGS,
  type AlgorithmVariant,
  type NotationPreferences,
  type Rating,
} from "@the-cube/academy";
import {
  learningScope,
  useLearningStorage,
  SaveRecovery,
} from "./learning-storage";
import "./catalog.css";

export const useCatalogStorage = () =>
  useLearningStorage(
    `the-cube-catalog-v1:${learningScope}`,
    newLibraryProgress(),
    validateLibraryProgress,
    "the-cube-catalog-backup.json",
  );
export type CatalogStore = ReturnType<typeof useCatalogStorage>;
const labels: Record<Rating, string> = {
  new: "New",
  learning: "Learning",
  comfortable: "Comfortable",
};
export function AlgorithmText({
  algorithm,
  notation,
}: {
  algorithm: string;
  notation: NotationPreferences;
}) {
  const chunks = notation.triggers
    ? algorithmChunks(algorithm)
    : algorithm.split(" ").map((moves) => ({ moves, label: "" }));
  return (
    <div
      className={`catalog-notation font-${notation.font} spacing-${notation.spacing}`}
      aria-label="Algorithm notation"
    >
      {chunks.map((chunk, i) => (
        <span key={i} className={chunk.label ? "notation-trigger" : ""}>
          <span>{chunk.moves.replaceAll("'", "′")}</span>
          {chunk.label && <small>{chunk.label}</small>}
        </span>
      ))}
    </div>
  );
}
export function CaseLearning({
  id,
  variant,
  store,
}: {
  id: string;
  variant: AlgorithmVariant["id"];
  store: CatalogStore;
}) {
  const saved = store.value.cases[id] ?? defaultCasePreference();
  function update(patch: Partial<typeof saved>) {
    store.save({
      ...store.value,
      cases: { ...store.value.cases, [id]: { ...saved, ...patch } },
    });
  }
  return (
    <div className="catalog-learning">
      <button
        className="secondary"
        aria-pressed={saved.favorite}
        onClick={() => update({ favorite: !saved.favorite })}
      >
        Favorite case
      </button>
      <label>
        My case rating
        <select
          value={saved.rating}
          onChange={(e) => update({ rating: e.target.value as Rating })}
        >
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {labels[r]}
            </option>
          ))}
        </select>
      </label>
      <label>
        My variant rating
        <select
          value={saved.variants[variant] ?? "new"}
          onChange={(e) =>
            update({
              variants: {
                ...saved.variants,
                [variant]: e.target.value as Rating,
              },
            })
          }
        >
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {labels[r]}
            </option>
          ))}
        </select>
      </label>
      <p className="catalog-help">
        Your own assessment, saved on this device. Watching playback does not
        change ratings or guided repetitions.
      </p>
    </div>
  );
}
export function NotationControls({ store }: { store: CatalogStore }) {
  const n = store.value.notation;
  const update = (patch: Partial<NotationPreferences>) =>
    store.save({ ...store.value, notation: { ...n, ...patch } });
  return (
    <details className="catalog-options">
      <summary>Notation preferences</summary>
      <p>
        Font, spacing and triggers apply to catalog and trainer notation
        previews. The optional palette applies to catalog diagrams and playback;
        letters always identify the original sticker colors. The original
        simulator keeps its own colors.
      </p>
      <div className="catalog-learning">
        <label>
          Notation font
          <select
            value={n.font}
            onChange={(e) =>
              update({ font: e.target.value as NotationPreferences["font"] })
            }
          >
            <option value="mono">Monospaced</option>
            <option value="readable">Reading font</option>
          </select>
        </label>
        <label>
          Move spacing
          <select
            value={n.spacing}
            onChange={(e) =>
              update({
                spacing: e.target.value as NotationPreferences["spacing"],
              })
            }
          >
            <option value="compact">Compact</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </label>
        <label>
          Catalog palette
          <select
            value={n.palette}
            onChange={(e) =>
              update({
                palette: e.target.value as NotationPreferences["palette"],
              })
            }
          >
            <option value="original">Original colors + letters</option>
            <option value="distinct">Distinct colors + letters</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={n.triggers}
            onChange={(e) => update({ triggers: e.target.checked })}
          />
          Show known trigger labels
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={n.slices}
            onChange={(e) => update({ slices: e.target.checked })}
          />
          Prefer reference notation with slices, wide turns or rotations
        </label>
      </div>
      <p>
        Reference preference applies where a verified variant exists and no
        case-specific override is set. Guided trainers retain their existing
        face-turn sequence.
      </p>
      <AlgorithmText algorithm="R U R' U' M2 U M2" notation={n} />
      <button
        className="quiet"
        onClick={() =>
          store.save({ ...store.value, notation: defaultNotation() })
        }
      >
        Reset notation only
      </button>
    </details>
  );
}
export function CatalogSettings() {
  const store = useCatalogStorage();
  return (
    <section className="info-card">
      <h2>Algorithm notation</h2>
      <SaveRecovery store={store} />
      <NotationControls store={store} />
      <a href="#/algorithms">Open algorithm catalog →</a>
    </section>
  );
}
export function TrainerLearning({ id }: { id: string }) {
  const store = useCatalogStorage(),
    item = libraryCase(id);
  return (
    <details className="catalog-options">
      <summary>Favorites, ratings & notation</summary>
      <SaveRecovery store={store} />
      <CaseLearning id={id} variant="standard" store={store} />
      <AlgorithmText
        algorithm={item.variants[0]!.algorithm}
        notation={store.value.notation}
      />
      <a href={`#/algorithms?case=${encodeURIComponent(id)}`}>
        Open {item.name} in the catalog →
      </a>
    </details>
  );
}
