export type ContrastPair = [string, string];

export type ContrastPairs = Map<string, ContrastPair>;

export type OnAddPair = () => void;

export type OnRemovePair = (id: string) => void;

export type OnUpdatePair = (id: string, position: 0 | 1, value: string) => void;

export interface UseExplicitContrasts {
  onAddPair: OnAddPair;
  onRemovePair: OnRemovePair;
  onUpdatePair: OnUpdatePair;
  pairs: ContrastPairs;
  valid: boolean;
}
