import { JSX } from "react";
import { FrontmatterProps } from "../../../../../../docs/common/frontmatter/types";
import { StyledImage } from "./heroImage.styles";

export const HeroImage = ({
  heroImage,
}: Pick<FrontmatterProps, "heroImage">): JSX.Element | null => {
  if (!heroImage) return null;
  return <StyledImage {...heroImage} />;
};
