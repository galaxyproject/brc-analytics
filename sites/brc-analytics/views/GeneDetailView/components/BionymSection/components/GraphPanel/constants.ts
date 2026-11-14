// The kinds of edge hidden when the graph first opens, chosen on the three
// checked-in graphs at the default 0.8. Each adds many nodes that crowd out
// the rest:
// - has_member links the gene's ortholog group to every protein in it
//   (2,460 for Kelch13);
// - same_as links aliases of one entity;
// - has_candidate_gene links candidate genes in related assemblies;
// - annotated_in links those genes to the assemblies they're annotated in.
// Hidden, they take Kelch13 from 5,111 nodes to 1,002, CRT from 2,386 to
// 1,452 and AMA1 from 1,475 to 1,061, and its gene column from 1,590 genes to
// 35. Each can be shown again with its switch.
export const DEFAULT_HIDDEN_PREDICATES: ReadonlySet<string> = new Set([
  "annotated_in",
  "has_candidate_gene",
  "has_member",
  "same_as",
]);

// How long the slider must rest before the network is redrawn at its value.
export const SLIDER_SETTLE_MS = 150;
