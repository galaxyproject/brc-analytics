import { Logo } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Logo/logo";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack } from "@mui/material";
import { type JSX } from "react";
import {
  FooterText,
  LargeBrand,
  SmallBrand,
  StyledStack,
} from "./branding.styles";

export const Branding = (): JSX.Element => {
  return (
    <StyledStack spacing={4} useFlexGap>
      <Stack direction={STACK_PROPS.DIRECTION.ROW} spacing={4} useFlexGap>
        <LargeBrand>
          <Logo
            alt="NIAID"
            height={24}
            link="https://www.niaid.nih.gov"
            src="/footer/niaid.svg"
            target={ANCHOR_TARGET.BLANK}
          />
        </LargeBrand>
        <LargeBrand>
          <Logo
            alt="NIH"
            height={24}
            link="https://www.nih.gov"
            src="/footer/nih.svg"
            target={ANCHOR_TARGET.BLANK}
          />
        </LargeBrand>
        <SmallBrand>
          <Logo
            alt="HHS"
            height={32}
            link="https://www.hhs.gov"
            src="/footer/hhs.svg"
            target={ANCHOR_TARGET.BLANK}
          />
        </SmallBrand>
        <SmallBrand>
          <Logo
            alt="USA.GOV"
            height={32}
            link="https://www.usa.gov"
            src="/footer/usagov.png"
            target={ANCHOR_TARGET.BLANK}
          />
        </SmallBrand>
      </Stack>
      <FooterText
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
      >
        BRC Analytics is a part of the Bioinformatics Resource Centers for
        Infectious Diseases Program developed and funded by{" "}
        <Link
          label="NIAID"
          url="https://www.niaid.nih.gov/research/bioinformatics-resource-centers"
        />
      </FooterText>
    </StyledStack>
  );
};
