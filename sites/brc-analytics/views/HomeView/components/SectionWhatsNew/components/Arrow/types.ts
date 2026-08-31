export const ARROW_DIRECTION = {
  BACK: "BACK",
  FORWARD: "FORWARD",
} as const;

export type ArrowDirection =
  (typeof ARROW_DIRECTION)[keyof typeof ARROW_DIRECTION];

export interface Props {
  direction: ArrowDirection;
  disabled: boolean;
  onClick: () => void;
}
