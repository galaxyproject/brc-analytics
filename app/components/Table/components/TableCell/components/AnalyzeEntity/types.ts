export interface ActionItem {
  label: string;
  url: string;
}

export interface AnalyzeEntityProps {
  analyze: ActionItem;
  views: ActionItem[];
}
