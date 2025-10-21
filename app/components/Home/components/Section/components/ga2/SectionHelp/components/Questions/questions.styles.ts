import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { sectionGrid } from "../../../../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const Grid = styled.div`
  ${sectionGrid};
  grid-column: 1 / -1;
  grid-template-columns: 1fr;

  ${bpUpSm} {
    grid-column: 6 / -1;
    grid-template-columns: repeat(7, 1fr);
  }

  .MuiAccordion-root {
    ol {
      margin: 0;
      padding-left: 24px;

      li {
        margin: 8px 0;

        &:first-of-type {
          margin-top: 0;
        }

        &:last-of-type {
          margin-bottom: 0;
        }
      }
    }
  }
`;
