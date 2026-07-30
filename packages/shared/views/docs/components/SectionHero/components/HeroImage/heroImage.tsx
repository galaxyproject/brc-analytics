import { type FrontmatterProps } from "@repo/shared/views/docs/common/frontmatter/types";
import { type JSX } from "react";
import { StyledImage } from "./heroImage.styles";

export const HeroImage = ({
  heroImage,
}: Pick<FrontmatterProps, "heroImage">): JSX.Element | null => {
  if (!heroImage) return null;
  return <StyledImage {...heroImage} />;
};
