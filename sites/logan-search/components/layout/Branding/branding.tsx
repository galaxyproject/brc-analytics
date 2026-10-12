import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ATTRIBUTION } from "@site-config/logan-search/local/attribution";
import { type JSX } from "react";
import { Credit, Credits } from "./branding.styles";

// Order is a placeholder too; it follows whatever the agreed wording ends up
// saying.
const CREDITS = [
  ATTRIBUTION.LOGAN_CITATION,
  ATTRIBUTION.KMINDEX,
  ATTRIBUTION.COMPUTE,
  ATTRIBUTION.OPERATOR,
];

/**
 * The footer's credits block. Every line is still a bracketed placeholder.
 * @returns the credits.
 */
export const Branding = (): JSX.Element => {
  return (
    <Credits>
      {CREDITS.map((credit) => (
        <Credit
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          key={credit}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          {credit}
        </Credit>
      ))}
    </Credits>
  );
};
