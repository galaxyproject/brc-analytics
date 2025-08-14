import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { ExploreView as DXExploreView } from "@databiosphere/findable-ui/lib/views/ExploreView/exploreView";
import styled from "@emotion/styled";
import { tableStyles } from "../../components/Table/table.styles";

export const StyledExploreView = styled(DXExploreView)`
  & .MuiToolbar-root.MuiToolbar-table {
    padding: 16px;

    .MuiButton-containedSecondary {
      padding-bottom: 8px;
      padding-top: 8px;
    }
  }

  & .MuiTableContainer-root {
    ${tableStyles};
  }

  .MuiTable-root {
    .MuiTableBody-root {
      .MuiTableCell-root {
        .MuiChip-root {
          max-width: 100%;
        }
      }
    }
  }

  ${bpDownSm} {
    .MuiPaper-table {
      min-height: 64px;
    }
  }
`;
