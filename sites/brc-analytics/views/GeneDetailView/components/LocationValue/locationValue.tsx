import {
  formatLocation,
  getUcscPositionUrl,
} from "@brc/views/GeneDetailView/utils";
import { OpenInNewIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/OpenInNewIcon/openInNewIcon";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { GENOME_BROWSER_IMAGE_PROPS } from "@repo/shared/viewModelBuilders/constants";
import { type JSX } from "react";
import { UcscLink } from "./locationValue.styles";
import { type LocationValueProps } from "./types";

/**
 * A gene's location, linked to the UCSC Genome Browser when its assembly has
 * one; plain text otherwise.
 * @param props - Component props.
 * @param props.location - Genome location.
 * @param props.ucscBrowserUrl - The assembly's UCSC Genome Browser address.
 * @returns The location.
 */
export const LocationValue = ({
  location,
  ucscBrowserUrl,
}: LocationValueProps): JSX.Element => {
  const text = formatLocation(location);
  if (!ucscBrowserUrl) return <>{text}</>;
  return (
    <UcscLink
      label={
        <>
          <StaticImage {...GENOME_BROWSER_IMAGE_PROPS} />
          {text}
          <OpenInNewIcon titleAccess="opens in a new tab" />
        </>
      }
      url={getUcscPositionUrl(ucscBrowserUrl, location)}
    />
  );
};
