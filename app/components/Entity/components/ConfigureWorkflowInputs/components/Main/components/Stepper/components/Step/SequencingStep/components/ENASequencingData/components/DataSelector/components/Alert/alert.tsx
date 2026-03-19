import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { SIZE } from "@databiosphere/findable-ui/lib/styles/common/constants/size";
import { AlertTitle } from "@mui/material";
import { JSX } from "react";
import { StyledAlert } from "./alert.styles";
import { Props } from "./types";

export const Alert = ({
  enaTaxonomyId,
  taxonomyMatches,
}: Props): JSX.Element | null => {
  if (enaTaxonomyId.isLoading) return null;
  if (!enaTaxonomyId.isEnabled) return null;

  if (taxonomyMatches > 0) return null;

  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_WARNING} size={SIZE.LARGE}>
      <AlertTitle>No matching read runs found by Taxonomy ID</AlertTitle>
      Data labels may not always be accurate. You can still select and use any
      available sequences.
    </StyledAlert>
  );
};
