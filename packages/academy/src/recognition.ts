import { PLL_CASES, pllCase, type PLLId } from "./pll.js";

export const RECOGNITION_LIMIT = 500;
export interface RecognitionAttempt {
  id: string;
  caseId: PLLId;
  answer: PLLId | null;
  at: number;
  elapsedMs: number | null;
}
export interface RecognitionProgress {
  version: 1;
  timed: boolean;
  history: RecognitionAttempt[];
}
export const newRecognitionProgress = (): RecognitionProgress => ({
  version: 1,
  timed: false,
  history: [],
});
export function validateRecognitionProgress(
  value: unknown,
): RecognitionProgress {
  const data = value as Partial<RecognitionProgress> | null;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.timed !== "boolean" ||
    !Array.isArray(data.history) ||
    data.history.length > RECOGNITION_LIMIT
  )
    throw new Error("Unsupported recognition history.");
  const ids = new Set<string>();
  const history = data.history.map((entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(entry.id) ||
      ids.has(entry.id) ||
      !Number.isSafeInteger(entry.at) ||
      entry.at < 0 ||
      entry.at > 8640000000000000 ||
      (entry.elapsedMs !== null &&
        (!Number.isSafeInteger(entry.elapsedMs) ||
          entry.elapsedMs < 0 ||
          entry.elapsedMs > 86400000)) ||
      (entry.answer === null && entry.elapsedMs !== null)
    )
      throw new Error("Invalid recognition attempt.");
    ids.add(entry.id);
    return {
      id: entry.id,
      caseId: pllCase(entry.caseId).id,
      answer: entry.answer === null ? null : pllCase(entry.answer).id,
      at: entry.at,
      elapsedMs: entry.elapsedMs,
    };
  });
  return { version: 1, timed: data.timed, history };
}
export function recordRecognition(
  progress: RecognitionProgress,
  attempt: RecognitionAttempt,
): RecognitionProgress {
  if (progress.history.some((entry) => entry.id === attempt.id))
    return progress;
  return validateRecognitionProgress({
    ...progress,
    history: [...progress.history, attempt].slice(-RECOGNITION_LIMIT),
  });
}
export function recognitionStats(history: RecognitionAttempt[]) {
  const correct = history.filter((entry) => entry.answer === entry.caseId);
  const times = correct
    .flatMap((entry) => (entry.elapsedMs === null ? [] : [entry.elapsedMs]))
    .sort((a, b) => a - b);
  return {
    total: history.length,
    correct: correct.length,
    revealed: history.filter((entry) => entry.answer === null).length,
    accuracy: history.length
      ? Math.round((correct.length / history.length) * 100)
      : null,
    medianMs: times.length
      ? (times[Math.floor((times.length - 1) / 2)]! +
          times[Math.floor(times.length / 2)]!) /
        2
      : null,
    timedCorrect: times.length,
  };
}
// Uniform draws by default. Review weights add one chance per recent mistake/reveal.
export function pickRecognitionCase(
  history: RecognitionAttempt[],
  review: boolean,
  previous?: PLLId,
  random = Math.random,
): PLLId {
  const candidates = PLL_CASES.filter((item) => item.id !== previous);
  const weights = candidates.map(
    (item) =>
      1 +
      (review
        ? history
            .slice(-100)
            .filter(
              (entry) =>
                entry.caseId === item.id && entry.answer !== entry.caseId,
            ).length
        : 0),
  );
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
    throw new Error("Invalid random sample.");
  let ticket = sample * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < candidates.length; i++) {
    ticket -= weights[i]!;
    if (ticket < 0) return candidates[i]!.id;
  }
  return candidates.at(-1)!.id;
}
