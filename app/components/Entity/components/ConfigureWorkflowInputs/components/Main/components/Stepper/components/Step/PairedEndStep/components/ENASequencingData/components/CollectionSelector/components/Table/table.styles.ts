import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import styled from "@emotion/styled";
import { smokeMain } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";

export const StyledRoundedPaper = styled(RoundedPaper)`
  background-color: ${smokeMain};
  margin: 24px;
  max-height: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: auto;

  .MuiTableContainer-root {
    overflow: unset;

    .MuiTableHead-root {
      box-shadow: 0 1px 0 0 ${smokeMain};
      position: sticky;
      top: 0;
      z-index: 1;
    }
  }
`;
