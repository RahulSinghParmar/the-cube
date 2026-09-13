import { validate3x3, type CubeState } from "@the-cube/cube-core";
import {
  ENGINE_VERSION,
  METHOD,
  hashState,
  verifySolution,
  type SolveRequest,
} from "@the-cube/solver";

export async function solveCube(
  input: CubeState,
  signal: AbortSignal,
  progress: (text: string) => void,
  timeoutMs = 45000,
) {
  const state = validate3x3(input);
  signal.throwIfAborted();
  const request: SolveRequest = {
    requestId: crypto.randomUUID(),
    state,
    stateHash: await hashState(state),
    engineVersion: ENGINE_VERSION,
    method: METHOD,
    deadlineMs: Date.now() + timeoutMs,
  };
  signal.throwIfAborted();
  return new Promise<ReturnType<typeof verifySolution>>((resolve, reject) => {
    const worker = new Worker(new URL("./solver.worker.ts", import.meta.url), {
      type: "module",
    });
    let finished = false;
    const cleanup = () => {
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener("abort", cancel);
    };
    const fail = (error: unknown) => {
      if (!finished) {
        cleanup();
        reject(error);
      }
    };
    const cancel = () =>
      fail(
        new DOMException(
          "Solve cancelled. Your input is unchanged.",
          "AbortError",
        ),
      );
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            "Solver timed out after 45 seconds. Your input is unchanged; try again.",
          ),
        ),
      timeoutMs,
    );
    signal.addEventListener("abort", cancel, { once: true });
    worker.onerror = () =>
      fail(
        new Error(
          "The solver could not load. Open the app online once, then retry.",
        ),
      );
    worker.onmessage = (event) => {
      if (
        finished ||
        signal.aborted ||
        event.data?.requestId !== request.requestId
      )
        return;
      if (Date.now() >= request.deadlineMs) {
        fail(new Error("Solver timed out. Try again."));
        return;
      }
      if (event.data.type === "progress") {
        progress(String(event.data.stage).slice(0, 100));
        return;
      }
      if (event.data.type === "error") {
        fail(new Error(String(event.data.message)));
        return;
      }
      if (event.data.type !== "solution") {
        fail(new Error("Unexpected solver response."));
        return;
      }
      try {
        const verified = verifySolution(request, event.data);
        cleanup();
        resolve(verified);
      } catch (error) {
        fail(error);
      }
    };
    try {
      worker.postMessage(request);
    } catch (error) {
      fail(error);
    }
  });
}
