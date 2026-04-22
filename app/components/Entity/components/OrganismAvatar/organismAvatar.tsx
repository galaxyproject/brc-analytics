import InfoIcon from "@mui/icons-material/Info";
import { Tooltip } from "@mui/material";
import { ImageData } from "app/apis/catalog/ga2/entities";
import React from "react";
import {
  Card,
  CardMedia,
  Detail,
  Details,
  IconButton,
  SourceLink,
  Thumbnail,
} from "./organismAvatar.styles";
interface OrganismAvatarProps {
  image: ImageData;
  isThumbnail?: boolean;
}

const AttributionDetails: React.FC<Pick<OrganismAvatarProps, "image">> = ({
  image,
}) => (
  <>
    {image.credit && <Detail>By: {image.credit}</Detail>}
    {image.license && <Detail>License: {image.license}</Detail>}
    {image.sourceName && image.sourceUrl && (
      <SourceLink href={image.sourceUrl}>Source: {image.sourceName}</SourceLink>
    )}
  </>
);

export const OrganismAvatar: React.FC<OrganismAvatarProps> = ({
  image,
  isThumbnail = false,
}) => {
  if (isThumbnail) {
    return <Thumbnail src={image.url} alt="Organism thumbnail" />;
  }
  return (
    <Card>
      <CardMedia image={image.url} title="Organism" />
      {image.license && image.credit && image.sourceName && image.sourceUrl && (
        <Details>
          <Tooltip title={<AttributionDetails {...{ image }} />}>
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Details>
      )}
    </Card>
  );
};
