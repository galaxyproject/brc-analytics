export interface ActionItem {
  label: string;
  url: string;
}

export interface AnalyzeGenomeProps {
  analyze: ActionItem;
  views: ActionItem[];
}
