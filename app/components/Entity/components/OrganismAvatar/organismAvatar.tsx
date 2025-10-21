import React from "react";
import { Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import {
  Card,
  CardMedia,
  Details,
  Detail,
  IconButton,
  SourceLink,
  Thumbnail,
} from "./organismAvatar.styles";

interface OrganismAvatarProps {
  credit: string | null;
  imagePath: string;
  isThumbnail?: boolean;
  license?: string | null;
  pageSource?: string | null;
  sourceLink?: string | null;
}

const AttributionDetails: React.FC<
  Pick<OrganismAvatarProps, "credit" | "license" | "pageSource" | "sourceLink">
> = ({ credit, license, pageSource, sourceLink }) => (
  <>
    {credit && <Detail>By: {credit}</Detail>}
    {license && <Detail>License: {license}</Detail>}
    {pageSource && sourceLink && (
      <SourceLink href={sourceLink}>Source: {pageSource}</SourceLink>
    )}
  </>
);

export const OrganismAvatar: React.FC<OrganismAvatarProps> = ({
  credit,
  imagePath,
  isThumbnail = false,
  license,
  pageSource,
  sourceLink,
}) => {
  if (isThumbnail) {
    return <Thumbnail src={imagePath} alt="Organism thumbnail" />;
  }
  return (
    <Card>
      <CardMedia image={imagePath} title="Organism" />
      {license && credit && pageSource && sourceLink && (
        <Details>
          <Tooltip
            title={
              <AttributionDetails
                {...{ credit, license, pageSource, sourceLink }}
              />
            }
          >
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Details>
      )}
    </Card>
  );
};
