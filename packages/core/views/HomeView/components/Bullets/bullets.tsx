import { JSX } from "react";
import { Bullet, Bullets as SectionBullets, StyledDot } from "./bullets.styles";
import { Props } from "./types";

export const Bullets = ({
  activeBullet,
  bullets,
  className,
  interactionEnabled = true,
  onBullet,
}: Props): JSX.Element | null => {
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
