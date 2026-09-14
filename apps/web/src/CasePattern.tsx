import { pllInput, type PLLId } from "@the-cube/academy";

export function CasePattern({
  id,
  small = false,
}: {
  id: PLLId;
  small?: boolean;
}) {
  const letters = pllInput(id).facelets;
  const grid = [
    null,
    47,
    46,
    45,
    null,
    36,
    0,
    1,
    2,
    11,
    37,
    3,
    4,
    5,
    10,
    38,
    6,
    7,
    8,
    9,
    null,
    18,
    19,
    20,
    null,
  ];
  return (
    <div
      className={`pll-pattern ${small ? "is-small" : ""}`}
      aria-hidden="true"
    >
      {grid.map((index, i) => (
        <span
          key={i}
          className={index === null ? "pattern-gap" : `color-${letters[index]}`}
        >
          {!small && index !== null ? letters[index] : ""}
        </span>
      ))}
    </div>
  );
}
