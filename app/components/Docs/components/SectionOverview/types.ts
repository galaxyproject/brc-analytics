import { ComponentProps } from "react";

export interface Overview {
  date: string;
  href: string;
  image: ComponentProps<"img">;
  title: string;
}

export interface Props {
  overview?: Overview[];
}
