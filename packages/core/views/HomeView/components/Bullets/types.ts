export interface Props {
  activeBullet: number;
  bullets: number[];
  className?: string;
  interactionEnabled?: boolean;
  onBullet: (index: number) => void;
}
