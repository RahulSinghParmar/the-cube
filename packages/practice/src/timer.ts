import { MAX_TIME, type Outcome } from './model.js';
export type Phase = 'idle' | 'inspectionPress' | 'inspecting' | 'holding' | 'running' | 'review';
export interface TimerResult { elapsedMs: number | null; penaltyMs: number; outcome: Outcome }
export function inspectionPenalty(elapsed: number): { penaltyMs: number; outcome: 'ok' | 'dnf' } {
  return { penaltyMs: elapsed >= 15_000 && elapsed < 17_000 ? 2000 : 0, outcome: elapsed >= 17_000 ? 'dnf' : 'ok' };
}
// The clock is injected: rendering frequency never affects measured duration.
export class PracticeTimer {
  phase: Phase = 'idle';
  result: TimerResult | null = null;
  private owner: string | null = null;
  private heldAt = 0;
  private startedAt = 0;
  private inspectionAt: number | null = null;
  private penaltyMs = 0;
  constructor(private readonly now: () => number, readonly inspection: boolean, readonly holdMs = 300) {}
  get active(): boolean { return this.phase !== 'idle' && this.phase !== 'review'; }
  get armed(): boolean { return this.phase === 'holding' && this.now() - this.heldAt >= this.holdMs; }
  get elapsed(): number { return this.phase === 'running' ? Math.max(0, Math.floor(this.now() - this.startedAt)) : this.result?.elapsedMs ?? 0; }
  get inspectionElapsed(): number { return this.inspectionAt === null ? 0 : Math.max(0, this.now() - this.inspectionAt); }
  press(owner: string): void {
    if (this.owner !== null || this.phase === 'review') return;
    this.owner = owner;
    if (this.phase === 'running') { this.finish('ok', this.elapsed); return; }
    if (this.phase === 'idle' && this.inspection) { this.phase = 'inspectionPress'; return; }
    if (this.phase === 'idle' || this.phase === 'inspecting') { this.phase = 'holding'; this.heldAt = this.now(); }
  }
  release(owner: string): void {
    if (owner !== this.owner) return;
    this.owner = null;
    if (this.phase === 'inspectionPress') { this.inspectionAt = this.now(); this.phase = 'inspecting'; return; }
    if (this.phase !== 'holding') return;
    if (!this.armed) { this.phase = this.inspectionAt === null ? 'idle' : 'inspecting'; return; }
    const penalty = inspectionPenalty(this.inspectionElapsed);
    if (this.inspectionAt !== null && penalty.outcome === 'dnf') { this.finish('dnf', null); return; }
    this.penaltyMs = this.inspectionAt === null ? 0 : penalty.penaltyMs;
    this.startedAt = this.now();
    this.phase = 'running';
  }
  // Native click activation provides a no-hold alternative for assistive input.
  activate(): void {
    if (this.phase === 'running') { this.finish('ok', this.elapsed); return; }
    if (this.phase === 'idle' && this.inspection) { this.inspectionAt = this.now(); this.phase = 'inspecting'; return; }
    if (this.phase !== 'idle' && this.phase !== 'inspecting') return;
    const penalty = inspectionPenalty(this.inspectionElapsed);
    if (this.inspectionAt !== null && penalty.outcome === 'dnf') { this.finish('dnf', null); return; }
    this.penaltyMs = this.inspectionAt === null ? 0 : penalty.penaltyMs;
    this.startedAt = this.now(); this.phase = 'running';
  }
  cancel(): void {
    this.owner = null;
    if (this.phase === 'running') this.finish('interrupted', this.elapsed);
    else if (this.phase !== 'review') { this.phase = 'idle'; this.inspectionAt = null; }
  }
  tick(): void {
    if ((this.phase === 'inspecting' || this.phase === 'holding') && this.inspectionAt !== null && this.inspectionElapsed >= 17_000) this.finish('dnf', null);
    if (this.phase === 'running' && this.elapsed >= MAX_TIME) this.finish('interrupted', MAX_TIME);
  }
  private finish(outcome: Outcome, elapsedMs: number | null): void {
    this.result = { outcome, elapsedMs: elapsedMs === null ? null : Math.min(elapsedMs, MAX_TIME), penaltyMs: this.penaltyMs };
    this.phase = 'review';
  }
}
