import {
  smokeMain,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import {
  sectionGrid,
  SectionLayout as DefaultLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { muiLink } from "../../section.styles";

export const Section = styled.section`
  background-color: ${white};
  border-top: 1px solid ${smokeMain};
  width: 100%;
`;

export const SectionLayout = styled(DefaultLayout)`
  ${sectionGrid};
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 96px 16px 102px;
`;

export const Subhead = styled.div`
  ${muiLink};
  font-size: 32px;
  font-weight: 400;
  line-height: 48px;
  margin: 0;
  text-align: center;
`;
