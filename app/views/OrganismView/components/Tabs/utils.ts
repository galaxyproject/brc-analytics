import { TAB } from "./constants";

/**
 * Returns the active tab value, normalized to one of the currently-rendered
 * tabs. A hash pointing at a hidden tab (e.g. `#pangenome` when the Pangenome
 * tab isn't shown) falls back to Workflows, so MUI Tabs never receives an
 * unmatched value (no selection + a runtime warning).
 * @param hash - Current URL hash (without the leading `#`).
 * @param showPangenome - Whether the Pangenome tab is rendered.
 * @returns The active tab value.
 */
export function getActiveTab(hash: string, showPangenome: boolean): string {
  if (!hash) return TAB.WORKFLOWS;

  const tabValues: string[] = [TAB.WORKFLOWS, TAB.ASSEMBLIES];

  if (showPangenome) {
    tabValues.push(TAB.PANGENOME);
  }

  return tabValues.includes(hash) ? hash : TAB.WORKFLOWS;
}
