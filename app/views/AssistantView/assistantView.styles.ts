import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

export const AssistantSection = styled(GridPaperSection)`
  padding: 24px 0;
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
  margin: "0 auto",
  maxWidth: "1400px",
  padding: "0 16px",
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
