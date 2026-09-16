// Project-authored guided setups using conventional face-turn triggers.
// IDs are lesson identifiers, not standard F2L case numbers. Frozen fixtures
// were generated with the independent cubejs engine and retain an unsolved last layer.
export const F2L_CATALOG = [
  {
    id: "F2L-right-insert",
    number: 1,
    title: "Insert with the right face",
    group: "ready",
    algorithm: "R U' R'",
    explanation:
      "These two pieces already form a pair. Move them into the front-right slot as one unit.",
    phases: [
      {
        start: 0,
        title: "Insert the pair",
        text: "R opens the slot, U′ carries the pair over it, and R′ closes the slot. Watch the two pieces travel together.",
      },
    ],
    facelets: "UUFUUUFFFUBUFRRLRRRRRFFUFFUDDBDDDDDDBRDLLLLLLLLRBBBBBB",
  },
  {
    id: "F2L-front-insert",
    number: 2,
    title: "Insert with the front face",
    group: "ready",
    algorithm: "F' U F",
    explanation:
      "The pair is ready on the other side. The front face gives you a second way to insert it.",
    phases: [
      {
        start: 0,
        title: "Insert from the front",
        text: "F′ opens the slot, U moves the pair into line, and F closes the slot.",
      },
    ],
    facelets: "FURUURUUURFFURRBRRBRFFFLFFLDDUDDDDDDLFRLLLLLLDBUBBBBBB",
  },
  {
    id: "F2L-align-right",
    number: 3,
    title: "Line up a right insertion",
    group: "ready",
    algorithm: "U R U' R'",
    explanation:
      "A connected pair can still be in the wrong place for an insertion. First position it above the correct slot.",
    phases: [
      {
        start: 0,
        title: "Line up the pair",
        text: "Use U to bring the connected pair to the starting position for the right-face insertion.",
      },
      {
        start: 1,
        title: "Insert together",
        text: "Use R U′ R′ to insert the pair. Compare its side colors with the green and red centers.",
      },
    ],
    facelets: "FUFUUFUUFRRRFRRLRRBRDFFUFFUDDBDDDDDDLLRLLLLLLUBUBBBBBB",
  },
  {
    id: "F2L-align-front",
    number: 4,
    title: "Line up a front insertion",
    group: "ready",
    algorithm: "U' F' U F",
    explanation:
      "The pair is connected, but needs one top turn before the front-face insertion.",
    phases: [
      {
        start: 0,
        title: "Line up the pair",
        text: "Use U′ to position the pair. A top turn keeps the cross and completed lower pairs in place.",
      },
      {
        start: 1,
        title: "Insert together",
        text: "Use F′ U F to place the corner and edge together.",
      },
    ],
    facelets: "UUFUUUURRDBUURRBRRRFFFFLFFLDDUDDDDDDBRFLLLLLLLFRBBBBBB",
  },
  {
    id: "F2L-separate-side",
    number: 5,
    title: "Pair with yellow on the side",
    group: "separate",
    algorithm: "U' R U R' U R U R'",
    explanation:
      "Both pieces are upstairs but apart. Track the yellow corner sticker and the green-red edge rather than every sticker on the cube.",
    phases: [
      {
        start: 0,
        title: "Position and pair",
        text: "Use U′ R U R′ U to arrange the corner and edge for the final insertion. The open slot gives the pieces space to move.",
      },
      {
        start: 5,
        title: "Insert the pair",
        text: "Use R U R′. Check the slot when the whole sequence is finished; temporary disruption is normal.",
      },
    ],
    facelets: "FUUFUUBURDRFFRRLRRRLFFFUFFUDDBDDDDDDLRULLLLLLRBUBBBBBB",
  },
  {
    id: "F2L-separate-half",
    number: 6,
    title: "Make room with a half turn",
    group: "separate",
    algorithm: "U' R U R' U2 R U' R'",
    explanation:
      "Both pieces are upstairs. A half turn of U moves pieces two positions around the top.",
    phases: [
      {
        start: 0,
        title: "Arrange the pieces",
        text: "Use U′ R U R′ U2 to bring the pieces into the right relationship. U2 is one written move but turns the face 180 degrees.",
      },
      {
        start: 5,
        title: "Insert the pair",
        text: "Finish with R U′ R′. The green and red sides must match their centers.",
      },
    ],
    facelets: "FFRUUULUFRFBLRRLRRBRDFFUFFFDDUDDDDDDUBULLLLLLURRBBBBBB",
  },
  {
    id: "F2L-yellow-up",
    number: 7,
    title: "Pair when yellow faces up",
    group: "separate",
    algorithm: "U R U2 R' U R U' R'",
    explanation:
      "The corner’s yellow sticker faces upward. Move it through the open slot to change its relationship with the edge.",
    phases: [
      {
        start: 0,
        title: "Prepare the pair",
        text: "Use U R U2 R′ U. Follow the yellow sticker as the corner moves; being in the right position is different from facing the right way.",
      },
      {
        start: 5,
        title: "Insert the pair",
        text: "Use R U′ R′ to finish the front-right pair.",
      },
    ],
    facelets: "FFBUUUUUDFBULRRLRRLFRFFUFFFDDUDDDDDDURBLLLLLLRRRBBBBBB",
  },
  {
    id: "F2L-yellow-up-short",
    number: 8,
    title: "A second yellow-up setup",
    group: "separate",
    algorithm: "R U' R' U2 R U R'",
    explanation:
      "The yellow sticker is up again, but the edge starts in a different place. Match both pieces before choosing a sequence.",
    phases: [
      {
        start: 0,
        title: "Reposition the pieces",
        text: "Use R U′ R′ U2 to arrange this specific pair. Do not use the previous yellow-up sequence without checking the edge.",
      },
      {
        start: 4,
        title: "Insert the pair",
        text: "Use R U R′ and inspect both side colors.",
      },
    ],
    facelets: "FURFUUUUDFFULRRURRBRRFFUFFBDDLDDDDDDLRRLLLLLLFBUBBBBBB",
  },
  {
    id: "F2L-joined-wrong",
    number: 9,
    title: "Separate a mismatched pair",
    group: "joined",
    algorithm: "R U R' U2 R U' R' U R U' R'",
    explanation:
      "The corner and edge touch, but are connected the wrong way. Inserting them immediately would not solve the slot.",
    phases: [
      {
        start: 0,
        title: "Separate and rearrange",
        text: "Use R U R′ U2. Notice that touching pieces are not necessarily a correctly matched pair.",
      },
      {
        start: 4,
        title: "Build the matching pair",
        text: "Use R U′ R′ U to change the relationship between the two pieces.",
      },
      {
        start: 8,
        title: "Insert the pair",
        text: "Finish with R U′ R′, then inspect the corner and edge together.",
      },
    ],
    facelets: "RUUUUULFFRRBLRRURRURDFFUFFFDDRDDDDDDUFFLLLLLLLBBBBBBBB",
  },
  {
    id: "F2L-corner-twisted-a",
    number: 10,
    title: "Free a twisted corner",
    group: "trapped",
    algorithm: "R U' R' U R U' R'",
    explanation:
      "The corner is already in the front-right slot but twisted. The matching edge is upstairs.",
    phases: [
      {
        start: 0,
        title: "Bring the corner out",
        text: "Use R U′ R′ U to release the corner and arrange it with its edge. A piece in the correct slot can still be oriented incorrectly.",
      },
      {
        start: 4,
        title: "Reinsert the pair",
        text: "Use R U′ R′ to put both pieces back correctly.",
      },
    ],
    facelets: "UUFUUFUULURRBRRFRRLFFFFUFFDDDRDDDDDDBRBLLLLLLULRBBBBBB",
  },
  {
    id: "F2L-corner-twisted-b",
    number: 11,
    title: "Free the other corner twist",
    group: "trapped",
    algorithm: "R U R' U' R U R'",
    explanation:
      "The corner is trapped with the other twist. Compare the yellow sticker with the previous setup.",
    phases: [
      {
        start: 0,
        title: "Release and arrange",
        text: "Use R U R′ U′ to move the corner out and arrange the pair.",
      },
      {
        start: 4,
        title: "Reinsert correctly",
        text: "Use R U R′. Check that yellow faces down and the side colors match.",
      },
    ],
    facelets: "UUUUUFRUBRRBBRRDRRFLUFFUFFRDDFDDDDDDFFULLLLLLLRLBBBBBB",
  },
  {
    id: "F2L-slot-repair",
    number: 12,
    title: "Repair an occupied slot",
    group: "trapped",
    algorithm: "R U' R' U R U2 R' U R U' R'",
    explanation:
      "The edge is correctly placed but the corner is twisted in the same slot. You must temporarily remove pieces to repair the pair.",
    phases: [
      {
        start: 0,
        title: "Open the occupied slot",
        text: "Use R U′ R′ U. Do not try to twist a corner by itself: legal turns move several pieces.",
      },
      {
        start: 4,
        title: "Arrange the pair",
        text: "Use R U2 R′ U to put the pieces into an insertion setup.",
      },
      {
        start: 8,
        title: "Restore the slot",
        text: "Finish with R U′ R′. The cross, all four pairs and their matching side colors are restored.",
      },
    ],
    facelets: "UUBUUUFUURBURRRDRRLLFFFFFFRDDFDDDDDDLFULLLLLLRRBBBBBBB",
  },
] as const;
