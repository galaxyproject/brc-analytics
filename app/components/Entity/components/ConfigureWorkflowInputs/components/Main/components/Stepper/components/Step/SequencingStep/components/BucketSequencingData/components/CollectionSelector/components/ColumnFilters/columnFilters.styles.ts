import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SearchAllFilters } from "@databiosphere/findable-ui/lib/components/Filter/components/SearchAllFilters/searchAllFilters";

export const StyledContainer = styled("div")`
  box-shadow: inset -1px 0 ${PALETTE.SMOKE_MAIN};
  overflow: auto;
`;

export const StyledSearchAllFilters = styled(SearchAllFilters)`
  margin: 8px 0;
  padding: 0 16px;
`;
