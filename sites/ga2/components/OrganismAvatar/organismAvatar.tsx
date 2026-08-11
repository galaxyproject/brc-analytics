import { type ImageData } from "@ga2/apis/assembly";
import InfoIcon from "@mui/icons-material/Info";
import { Tooltip } from "@mui/material";
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

const MISSING_IMAGE_URL = "/organism_image/missing_image.png";

interface OrganismAvatarProps {
  image?: ImageData | null;
  isThumbnail?: boolean;
  thumbnailUrl?: string | null;
}

const AttributionDetails: React.FC<{ image: ImageData }> = ({ image }) => (
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
  thumbnailUrl,
}) => {
  // List view: always render a small thumbnail, falling back to a generic
  // missing-image graphic when the organism has no image.
  if (isThumbnail) {
    return (
      <Thumbnail
        src={thumbnailUrl || MISSING_IMAGE_URL}
        alt="Organism thumbnail"
      />
    );
  }
  // Detail view: render nothing when there is no image, rather than an empty box.
  if (!image) return null;
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
