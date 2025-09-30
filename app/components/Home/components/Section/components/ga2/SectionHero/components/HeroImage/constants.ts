import { ImageProps } from "next/image";

export const IMAGE_PROPS: Omit<ImageProps, "alt"> = {
  height: 623,
  priority: true,
  src: "/hero/hero.png",
  width: 1112,
};
