import test from "node:test";
import assert from "node:assert/strict";
import Cube from "../../packages/solver/vendor/cube.js";
import {
  apply,
  parseMove,
  solved,
} from "../../packages/cube-core/dist/index.js";
import {
  LIBRARY,
  libraryCase,
  libraryInput,
  verifyLibraryCase,
  recognitionCues,
  newLibraryProgress,
  defaultCasePreference,
  validateLibraryProgress,
  searchLibrary,
  preferredVariant,
  algorithmChunks,
} from "../../packages/academy/dist/index.js";

test("90 stable catalog IDs and 29 additional variants pass independent fixtures and orientation checks", () => {
  assert.equal(LIBRARY.length, 90);
  assert.equal(new Set(LIBRARY.map((c) => c.id)).size, 90);
  assert.equal(
    LIBRARY.reduce((n, c) => n + c.variants.length - 1, 0),
    29,
  );
  for (const item of LIBRARY) {
    verifyLibraryCase(item.id);
    assert.ok(recognitionCues(item).length);
    const expected = Cube.fromString(item.facelets)
      .move(item.variants[0].algorithm)
      .asString();
    for (const variant of item.variants) {
      assert.equal(
        Cube.fromString(item.facelets).move(variant.algorithm).asString(),
        expected,
        `${item.id}/${variant.id} independent fixture`,
      );
      // Check the parser/renderer-domain permutation beyond the prepared fixture.
      for (const start of [
        libraryInput(item),
        solved(3),
        { ...solved(3), facelets: new Cube().move("F R2 U B L'").asString() },
      ]) {
        const core = variant.algorithm
          .split(" ")
          .reduce((s, t) => apply(s, parseMove(t, 3)), start);
        assert.equal(
          core.facelets,
          Cube.fromString(start.facelets).move(variant.algorithm).asString(),
          `${item.id}/${variant.id} permutation`,
        );
      }
      assert.equal(
        algorithmChunks(variant.algorithm)
          .map((c) => c.moves)
          .join(" "),
        variant.algorithm,
        "presentation never changes moves",
      );
    }
  }
});
test("catalog preferences validate strictly and cannot become practice credit", () => {
  const p = newLibraryProgress();
  p.cases.H = {
    ...defaultCasePreference(),
    favorite: true,
    rating: "comfortable",
    preferred: "reference",
    variants: { standard: "learning", reference: "comfortable" },
  };
  p.favoriteSets = ["PLL"];
  assert.deepEqual(validateLibraryProgress(p), p);
  assert.equal("repetitions" in p.cases.H, false);
  for (const bad of [
    null,
    { ...p, version: 2 },
    { ...p, cases: { unknown: defaultCasePreference() } },
    {
      ...p,
      cases: { Ua: { ...defaultCasePreference(), preferred: "reference" } },
    },
    { ...p, cases: { H: { ...p.cases.H, rating: "mastered" } } },
    { ...p, notation: { ...p.notation, palette: "bad" } },
    { ...p, filters: { ...p.filters, query: "x".repeat(121) } },
  ])
    assert.throws(() => validateLibraryProgress(bad));
  p.notation.slices = true;
  assert.equal(preferredVariant(libraryCase("Aa"), p).id, "reference");
  assert.equal(preferredVariant(libraryCase("Ua"), p).id, "standard");
  p.cases.Aa = { ...defaultCasePreference(), preferred: "standard" };
  assert.equal(preferredVariant(libraryCase("Aa"), p).id, "standard");
});
test("search composes collection, words, favorites and explicit ratings without changing stable IDs", () => {
  const p = newLibraryProgress();
  p.cases.OLL27 = {
    ...defaultCasePreference(),
    favorite: true,
    rating: "learning",
  };
  p.filters = {
    query: "sune",
    collection: "OLL",
    favorites: true,
    rating: "learning",
    sort: "name",
  };
  assert.deepEqual(
    searchLibrary(p).map((c) => c.id),
    ["OLL27"],
  );
  p.filters.query = "not-a-case";
  assert.equal(searchLibrary(p).length, 0);
  p.filters = newLibraryProgress().filters;
  p.favoriteSets = ["F2L"];
  p.filters.favorites = true;
  assert.equal(searchLibrary(p).length, 13);
  p.filters.favorites = false;
  assert.equal(searchLibrary(p).length, 90);
});
