/**
 * Navigation options for opening a saved conversation.
 */
export interface OpenSavedAnalysisOptions {
  replace?: boolean;
}

export interface Props {
  initialLoganJobId?: string;
  initialMessage?: string;
  initialSessionId?: string;
  introText: string;
  sessionKey: string;
}
