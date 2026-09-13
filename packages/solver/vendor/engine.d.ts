declare class Cube {
  static initSolver(): void;
  static fromString(input: string): Cube;
  static random(): Cube;
  move(sequence: string): Cube;
  asString(): string;
  solve(maxDepth?: number): string;
}
export default Cube;
