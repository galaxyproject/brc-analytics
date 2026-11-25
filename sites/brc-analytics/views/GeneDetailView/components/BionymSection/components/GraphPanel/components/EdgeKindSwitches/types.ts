export interface EdgeKindSwitchesProps {
  // Each kind of edge in the graph and its count, most first.
  counts: [string, number][];
  hidden: ReadonlySet<string>;
  onToggle: (predicate: string) => void;
}
