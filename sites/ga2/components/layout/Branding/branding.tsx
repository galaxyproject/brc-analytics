import { Logo } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Logo/logo";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { type JSX } from "react";
import { Brands, FooterText, SmallBrand } from "./branding.styles";

export const Branding = (): JSX.Element => {
  return (
    <Brands>
      <SmallBrand>
        <Logo
          alt="NSF"
          height={32}
          link="https://www.nsf.gov/"
          src="/footer/nsf.png"
          target={ANCHOR_TARGET.BLANK}
        />
      </SmallBrand>
      <FooterText
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
      >
        U.S National Science Foundation Award
        <Link
          label=" #2419522"
          url="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2419522&HistoricalAwards=false"
        />
      </FooterText>
    </Brands>
  );
};
