import { type BionymClaims } from "@repo/shared/services/genes/types";
import { type TAB } from "./constants";

export type BionymTab = (typeof TAB)[keyof typeof TAB];

export interface BionymSectionProps {
  bionym: BionymClaims;
}

// The confidence threshold the section's tabs share, and how to change it.
export interface MinConfidenceProps {
  minConfidence: number;
  onMinConfidenceChange: (minConfidence: number) => void;
}

// The tab the section shows, and how to choose another.
export interface BionymTabState {
  selectTab: (tab: BionymTab) => void;
  tab: BionymTab;
}
