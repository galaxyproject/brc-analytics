import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import styled from "@emotion/styled";

// An optional logo, the text and an off-site icon, inline so that a narrow
// value column wraps the text rather than stacking the three.
export const StyledLink = styled(Link)`
  img,
  svg {
    vertical-align: middle;
  }

  img {
    display: inline-block;
    margin-right: 4px;
  }

  svg {
    margin-left: 4px;
  }
`;
