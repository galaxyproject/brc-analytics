import { JSX } from "react";
import { Bullet, Bullets as SectionBullets, StyledDot } from "./bullets.styles";

interface BulletsProps {
  activeBullet: number;
  bullets: number[];
  className?: string;
  interactionEnabled?: boolean;
  onBullet: (index: number) => void;
}

export const Bullets = ({
  activeBullet,
  bullets,
  className,
  interactionEnabled = true,
  onBullet,
}: BulletsProps): JSX.Element | null => {
  if (!interactionEnabled) return null;
  return (
    <SectionBullets className={className}>
      {bullets.map((bullet) => (
        <Bullet
          key={bullet}
          onClick={(): void => {
            onBullet(bullet);
          }}
          onKeyDown={(): void => {
            onBullet(bullet);
          }}
        >
          <StyledDot isActive={activeBullet === bullet} />
        </Bullet>
      ))}
    </SectionBullets>
  );
};
