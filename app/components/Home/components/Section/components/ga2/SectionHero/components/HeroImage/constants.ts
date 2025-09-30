import { ImageProps } from "next/image";

export const IMAGE_PROPS: Omit<ImageProps, "alt"> = {
  height: 623,
  priority: true,
  src: "/main/hero/tree.png",
  width: 1112,
};

export const IMAGE_PROPS_SMALL: Omit<ImageProps, "alt"> = {
  fill: true,
  src: "/main/hero/tree-small.png",
};

export const IMAGE_PROPS_XSMALL: Omit<ImageProps, "alt"> = {
  fill: true,
  src: "/main/hero/tree-xsmall.png",
};
