import styled from "@emotion/styled";
import { Typography } from "@mui/material";

// The footer toolbar has no vertical padding of its own at desktop widths, and
// four lines of credits would otherwise sit flush against the page edge.
export const Credits = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
`;

export const Credit = styled(Typography)`
  max-width: 560px;
`;
