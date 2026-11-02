import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import styled from "@emotion/styled";

// The UCSC logo, the location and an off-site icon, inline so that a narrow
// value column wraps the location's text rather than stacking the three.
export const UcscLink = styled(Link)`
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
