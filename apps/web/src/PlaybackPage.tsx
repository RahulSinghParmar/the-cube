import { useState } from "react";
import { PUZZLES, puzzleForSize, sequenceTokens, solved, type Size } from "@the-cube/cube-core";
import { SequencePlayer } from "./SequencePlayer";
import type { Preferences } from "./preferences";
import "./learning.css";

const examples: Record<Size, string> = {
  2: "R U R' U'",
  3: "R U R' U' M M' x x'",
  4: "Rw U Rw' U' 2R 2R' x x'",
  5: "3Rw U 3Rw' U' M M' x x'",
};
export function PlaybackPage({ preferences }: { preferences: Preferences }) {
  const [size, setSize] = useState<Size>(3);
  const [draft, setDraft] = useState(examples[3]);
  const [sequence, setSequence] = useState(examples[3]);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const puzzle = puzzleForSize(size);
  return <div className="playback-page">
    <p className="eyebrow">GUIDES / MOVE EXPLORER</p>
    <h1 tabIndex={-1}>See what each move does.</h1>
    <p>Choose a cube, then follow the moves at your pace. Drag the cube to look around; reset its viewing angle whenever you need.</p>
    <form className="playback-editor" onSubmit={event => {
      event.preventDefault();
      try {
        const tokens = sequenceTokens(draft, size);
        setSequence(tokens.join(" "));
        setRevision(value => value + 1);
        setError("");
      } catch (e) { setError((e as Error).message); }
    }}>
      <label>Puzzle
        <select value={size} onChange={event => {
          const next = Number(event.target.value) as Size;
          setSize(next); setDraft(examples[next]); setSequence(examples[next]); setError("");
        }}>{PUZZLES.map(item => <option key={item.id} value={item.size}>{item.label}</option>)}</select>
      </label>
      <label>Move sequence to explore
        <textarea value={draft} maxLength={10000} rows={2} spellCheck={false}
          aria-describedby="notation-help" onChange={event => setDraft(event.target.value)} />
      </label>
      <button type="submit">Load sequence</button>
    </form>
    <p id="notation-help">Separate moves with spaces. R = right face, R' = reverse, R2 = half turn. Rw or r = two layers; x, y, z = rotate the whole cube.</p>
    {error && <p className="error" role="alert">{error} The displayed sequence is unchanged.</p>}
    <h2>Explore the sequence</h2>
    <SequencePlayer key={`${size}:${revision}`} input={solved(size)} moves={sequenceTokens(sequence, size)} preferences={preferences}
      playLabel="Play sequence"
      completionText="Sequence complete. This explorer shows the effect of your moves; it does not solve the cube or record practice credit."
      guideForStep={step => <p className="step-explanation" data-testid="step-explanation">{step === 0 ? `Start with a solved ${puzzle.label}. The large move below is the one to do next.` : `Completed ${step} move${step === 1 ? "" : "s"}. The cube and face grids show exactly this position in the sequence.`}</p>} />
    <details className="lesson-notes">
      <summary>Notation and puzzle support</summary>
      <p>On 3×3–5×5, 2R means only the second layer from the right. 3Rw means the three rightmost layers together. Lowercase r always means Rw here, not an inner slice.</p>
      <p>M, E and S turn the single middle layer in the directions of L, D and F. These are available on 3×3 and 5×5. On even cubes, use numbered inner layers to avoid ambiguity.</p>
      <p>Play, rewind, seek, speed and face grids work on each size listed above. Only 3×3 currently has a solver, prepared beginner exercises and F2L/OLL/PLL trainers. Complete multi-size courses, 6×6, 7×7 and Bluetooth support are later releases.</p>
      <p>Use individual moves only; bracketed commutators and repeated groups are not supported yet. Up to 500 moves can be loaded. This page does not change your saved practice cube or progress.</p>
    </details>
  </div>;
}
