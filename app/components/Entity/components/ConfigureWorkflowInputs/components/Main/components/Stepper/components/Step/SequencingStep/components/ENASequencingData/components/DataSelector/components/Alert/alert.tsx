import { Props } from "./types";
import { AlertTitle } from "@mui/material";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { StyledAlert } from "./alert.styles";
import { SIZE } from "@databiosphere/findable-ui/src/styles/common/constants/size";

export const Alert = ({
  enaTaxonomyIdStatus,
  taxonomyMatches,
}: Props): JSX.Element | null => {
  if (enaTaxonomyIdStatus.loading) return null;
  if (!enaTaxonomyIdStatus.eligible) return null;

  if (taxonomyMatches > 0) return null;

  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_WARNING} size={SIZE.LARGE}>
      <AlertTitle>No matching read runs found by Taxonomy ID</AlertTitle>
      Data labels may not always be accurate. You can still select and use any
      available sequences.
    </StyledAlert>
  );
};
