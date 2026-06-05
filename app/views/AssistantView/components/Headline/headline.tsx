import { Title } from "@databiosphere/findable-ui/lib/components/common/Title/title";
import { LINK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/link";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { ArrowForwardRounded } from "@mui/icons-material";
import Link from "next/link";
import type { JSX } from "react";
import { StyledLink, StyledStack } from "./headline.styles";

export const Headline = (): JSX.Element => {
  return (
    <StyledStack direction={STACK_PROPS.DIRECTION.ROW} useFlexGap>
      <Title>Analysis Assistant (Beta)</Title>
      <StyledLink
        component={Link}
        href="/learn/assistant"
        underline={LINK_PROPS.UNDERLINE.NONE}
      >
        About the Assistant
        <ArrowForwardRounded fontSize={SVG_ICON_PROPS.FONT_SIZE.XXSMALL} />
      </StyledLink>
    </StyledStack>
  );
};
