import { JSX } from "react";
import { Logo } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Logo/logo";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { Brands, FooterText, LargeBrand, SmallBrand } from "./branding.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { VersionDisplay } from "./components/VersionDisplay/versionDisplay";

export const Branding = (): JSX.Element => {
  return (
    <Brands>
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
      <VersionDisplay />
    </Brands>
  );
};

export const GA2Branding = (): JSX.Element => {
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
