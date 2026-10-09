// Run count for Logan v1, which covers public SRA data released up to December
// 2023. From Chikhi et al., "Logan: planetary-scale genome assembly surveys
// life's diversity" (2024). Rounded down; check against the paper before
// changing the wording around it.
const LOGAN_RUN_COUNT = "27 million";

// Matches the number of kmindex indexes the Learn page describes.
const LOGAN_INDEX_COUNT = 109;

/**
 * Facts under the home page title, shown on one line separated by middle dots.
 * The search time is the same claim the Learn page makes (a minute or two,
 * longer when the Galaxy queue is busy).
 */
export const LOGAN_STATS = [
  `${LOGAN_RUN_COUNT} SRA runs to the end of 2023`,
  `${LOGAN_INDEX_COUNT} indexes`,
  "Results usually in minutes",
];
