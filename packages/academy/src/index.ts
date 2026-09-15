import {
  apply,
  inverse,
  notation,
  parseMove,
  solved,
  type CubeState,
} from "@the-cube/cube-core";

export const COURSE_VERSION = 1;
export const COURSE_SOURCE = "https://www.rubiks.com/solution-guides";
export interface Lesson {
  id: string;
  revision: 1;
  title: string;
  goal: string;
  paragraphs: string[];
  algorithm: string;
  checkpoint: "solved" | "cross" | "layer" | "two-layers";
}
const cross = "F2",
  corner = "R' D' R D",
  middle = "D R D' R' D' B' D B";
const orient = "B R D R' D' B' R D R' D R D2 R'";
const permute = "R D' R D R D R D' R' D' R2";
// Project-authored text and orientation-adapted, conventional beginner triggers.
// Each exercise is an inverse-setup fixture; it is not an arbitrary-state solver.
export const LESSONS: readonly Lesson[] = [
  {
    id: "basics",
    revision: 1,
    title: "Meet your cube",
    goal: "Find centers, edges and corners.",
    paragraphs: [
      "A center has one color, an edge has two and a corner has three. Centers define where colors belong; an edge cannot become a corner.",
      "In these lessons, hold white on top (U), green in front (F) and red to the right (R). Drag the view to look around; dragging does not turn a face.",
      "Turn the right face, then undo it. Watch which pieces travel together. The letters stay attached to the colors.",
    ],
    algorithm: "R R'",
    checkpoint: "solved",
  },
  {
    id: "notation",
    revision: 1,
    title: "Read a move",
    goal: "Understand clockwise, reverse and half turns.",
    paragraphs: [
      "U, R, F, D, L and B mean up, right, front, down, left and back. Directions are always judged while looking straight at the face being turned.",
      "A plain letter is a clockwise quarter turn. A prime (′) reverses it. A 2 means a half turn, in either direction. R2 counts as one written move.",
      "Try a top turn and its inverse, then two right-face half turns. Keep the cube orientation fixed while reading the moves.",
    ],
    algorithm: "U U' R2 R2",
    checkpoint: "solved",
  },
  {
    id: "cross",
    revision: 1,
    title: "Build the white cross",
    goal: "Match white edges to the side centers.",
    paragraphs: [
      "A cross is four white edges around the white center. The side color of each edge must also match its side center; four white stickers alone are not enough.",
      "This prepared example places the white-green edge below its destination. Its green sticker faces the green center. Turn F2 to lift it into the white cross.",
      "On a physical scramble, bring one white edge at a time into the lower layer, align its side color, then lift it. Protect edges you have already placed.",
    ],
    algorithm: cross,
    checkpoint: "cross",
  },
  {
    id: "first-layer",
    revision: 1,
    title: "Place the first-layer corners",
    goal: "Keep the cross while inserting a corner.",
    paragraphs: [
      "Use all three colors to locate a corner: the white-green-red corner belongs where those three centers meet. Place the target at upper front-right.",
      "The prepared case uses R′ D′ R D. Follow the full sequence rather than judging the cube halfway through; pieces can temporarily leave their places.",
      "Different physical cases need different setup turns or repetitions. This drill covers one checked case. Keep white on top; do not rotate the whole cube between moves.",
    ],
    algorithm: corner,
    checkpoint: "cross",
  },
  {
    id: "second-layer",
    revision: 1,
    title: "Fill the middle layer",
    goal: "Insert a middle edge without losing the white layer.",
    paragraphs: [
      "With the white layer on top, find a lower-layer edge without yellow. Its two colors identify the middle-layer slot it needs.",
      "This prepared insertion works toward the back-right slot using D R D′ R′ D′ B′ D B. White stays on top. Notice how the white layer returns after the full sequence.",
      "If an edge is trapped in the wrong slot, an insertion can first move it out. Align its side color before choosing the appropriate left or right insertion. This exercise covers the displayed case only.",
    ],
    algorithm: middle,
    checkpoint: "layer",
  },
  {
    id: "orientation",
    revision: 1,
    title: "Turn the last-layer colors",
    goal: "Separate orientation from position.",
    paragraphs: [
      "The last layer is yellow on D in our fixed orientation. Orientation means pointing yellow outward; permutation means putting pieces in the correct slots.",
      "This prepared drill combines a yellow-cross trigger and a corner-orientation trigger. The first two layers return after each complete trigger. They may look disturbed during individual moves.",
      "An arbitrary cube may need a different setup or repeated triggers. Follow the face letters carefully, especially D and B: clockwise is judged from outside that face.",
    ],
    algorithm: orient,
    checkpoint: "two-layers",
  },
  {
    id: "permutation",
    revision: 1,
    title: "Move the last pieces home",
    goal: "Match the side colors of the last layer.",
    paragraphs: [
      "A yellow face can be complete while its side colors are still misplaced. Compare each last-layer piece with its side centers.",
      "The prepared case cycles three yellow-layer edges. Apply the complete sequence while keeping white on top. All sticker orientations return at the end.",
      "Corner placement and the opposite edge cycle are other cases. Do not apply this sequence blindly to every scramble. Use the verified solver for a complete solution to a manually entered state.",
    ],
    algorithm: permute,
    checkpoint: "two-layers",
  },
  {
    id: "review",
    revision: 1,
    title: "Review a complete solve",
    goal: "Connect the stages in a prepared solve.",
    paragraphs: [
      "This example joins the earlier moves into one checked solve: cross, first-layer corner, middle edge, last-layer orientation and last-layer permutation.",
      "Pause after each complete trigger to inspect the pieces. Temporary disruption during a move is normal; compare the cube at stage boundaries.",
      "Practicing this fixed example is a starting point, not proof that every case is mastered. Repeat the individual lessons, then enter your own 3×3 in Solve for an independently verified generic solution.",
    ],
    algorithm: [cross, corner, middle, orient, permute].join(" "),
    checkpoint: "solved",
  },
];
export function lessonMoves(lesson: Lesson): string[] {
  return lesson.algorithm.split(/\s+/);
}
export function lessonInput(lesson: Lesson): CubeState {
  return lessonMoves(lesson)
    .slice()
    .reverse()
    .reduce(
      (state, token) => apply(state, inverse(parseMove(token, 3))),
      solved(3),
    );
}
export function moveDescription(token: string): string {
  const move = parseMove(token, 3);
  const faces: Record<string, string> = {
    U: "top",
    R: "right",
    F: "front",
    D: "bottom",
    L: "left",
    B: "back",
  };
  return `Turn the ${faces[move.face]} face ${move.turns === 2 ? "a half turn (180°)" : move.turns === 3 ? "counterclockwise (90°)" : "clockwise (90°)"}, looking directly at that face.`;
}
export function acceptLessonMove(
  lesson: Lesson,
  step: number,
  token: string,
): CubeState {
  const moves = lessonMoves(lesson);
  if (
    step < 0 ||
    step >= moves.length ||
    notation(parseMove(token, 3)) !== moves[step]
  )
    throw new Error(
      `Try ${moves[step] ?? "restarting the exercise"}. The cube has not changed.`,
    );
  return moves
    .slice(0, step + 1)
    .reduce(
      (state, move) => apply(state, parseMove(move, 3)),
      lessonInput(lesson),
    );
}
export interface LessonProgress {
  revision: 1;
  step: number;
  practiced: number;
}
export interface CourseProgress {
  version: 1;
  lessons: Record<string, LessonProgress>;
}
export function validateProgress(value: unknown): CourseProgress {
  if (!value || typeof value !== "object")
    throw new Error("Unreadable lesson progress.");
  const data = value as Partial<CourseProgress>;
  if (
    data.version !== COURSE_VERSION ||
    !data.lessons ||
    typeof data.lessons !== "object" ||
    Array.isArray(data.lessons)
  )
    throw new Error("Unsupported lesson progress version.");
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, progress] of Object.entries(data.lessons)) {
    const lesson = LESSONS.find((item) => item.id === id);
    if (
      !lesson ||
      !progress ||
      progress.revision !== lesson.revision ||
      !Number.isInteger(progress.step) ||
      !Number.isInteger(progress.practiced) ||
      progress.step < 0 ||
      progress.practiced < 0 ||
      progress.step > lessonMoves(lesson).length ||
      progress.practiced > lessonMoves(lesson).length
    )
      throw new Error(
        "Saved lesson progress does not match this course revision.",
      );
    lessons[id] = {
      revision: 1,
      step: progress.step,
      practiced: progress.practiced,
    };
  }
  return { version: 1, lessons };
}
export * from "./pll.js";

export * from "./recognition.js";

export * from "./oll.js";
