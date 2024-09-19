import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  grid-template-columns: 1fr;
  padding: 98px 16px;

  .MuiLink-root {
    color: inherit;
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }
`;
