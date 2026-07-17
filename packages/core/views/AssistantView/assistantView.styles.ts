import { sectionLayout } from "@brc-analytics/core/components/Layout/components/Section/section.styles";
import styled from "@emotion/styled";
import { Box, Stack } from "@mui/material";

export const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
`;

export const SectionContent = styled(Stack)`
  ${sectionLayout};
  padding: 0 16px;
  width: calc(100% - 32px);
`;

export const TwoPanelLayout = styled(Box)({
  "@media (min-width: 960px)": {
    flexDirection: "row",
    height: "calc(100vh - 280px)",
    minHeight: "500px",
  },
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

export const ChatColumn = styled(Box)({
  "@media (min-width: 960px)": {
    flex: 2,
  },
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  minHeight: "400px",
  overflow: "hidden",
});

export const SchemaColumn = styled(Box)({
  "@media (min-width: 960px)": {
    flex: 1,
    maxWidth: "380px",
  },
});

export const AssistantDisclaimer = styled(Box)({
  color: "#5f6b7c",
  fontSize: "0.75rem",
  lineHeight: 1.5,
  paddingBottom: "16px",
  paddingTop: "16px",
  textAlign: "center",
});
