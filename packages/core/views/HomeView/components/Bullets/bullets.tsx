import { JSX } from "react";
import { Bullet, Bullets as SectionBullets, StyledDot } from "./bullets.styles";
import { BULLETS_CLASSES } from "./constants";
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
          className={
            activeBullet === bullet ? BULLETS_CLASSES.BULLET_ACTIVE : undefined
          }
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
