import { OpenInNewIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/OpenInNewIcon/openInNewIcon";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { type JSX } from "react";
import { StyledLink } from "./offSiteLink.styles";
import { type OffSiteLinkProps } from "./types";

/**
 * A link to another site, opening in a new tab: an optional logo, the text,
 * then an off-site icon. Plain text when there is no address.
 * @param props - Component props.
 * @param props.imageProps - The other site's logo, if shown.
 * @param props.text - Link text.
 * @param props.url - The other site's address, or null.
 * @returns The link, or the text.
 */
export const OffSiteLink = ({
  imageProps,
  text,
  url,
}: OffSiteLinkProps): JSX.Element => {
  if (!url) return <>{text}</>;
  return (
    <StyledLink
      label={
        <>
          {imageProps && <StaticImage {...imageProps} />}
          {text}
          <OpenInNewIcon titleAccess="opens in a new tab" />
        </>
      }
      url={url}
    />
  );
};
