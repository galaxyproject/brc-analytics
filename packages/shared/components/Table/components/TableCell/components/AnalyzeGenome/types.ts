interface ActionItem {
  label: string;
  url: string;
}

export interface Props {
  analyze: ActionItem;
  views: ActionItem[];
}
