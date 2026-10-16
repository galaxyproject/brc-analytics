/**
 * The saved analysis the conversation on screen belongs to, after a turn. A
 * session's analysis never changes, so a reply without one for the same session
 * keeps the one already known; a different session takes the reply's.
 * @param current - Saved analysis known before the turn, or null.
 * @param reported - Saved analysis the turn's reply reports, or null.
 * @param isSameSession - Whether the turn ran in the session already on screen.
 * @returns The saved analysis to show as open, or null.
 */
export function keepSavedAnalysisId(
  current: string | null,
  reported: string | null,
  isSameSession: boolean
): string | null {
  if (reported !== null) return reported;
  return isSameSession ? current : null;
}
