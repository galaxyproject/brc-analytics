import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import {
  inkLight,
  smokeDark,
  smokeLightest,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import {
  textBody4002Lines,
  textBody500,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

interface Props {
  isAvailable: boolean;
}

export const StyledSection = styled(GridPaperSection, {
  shouldForwardProp: (props) => props !== "isAvailable",
})<Props>`
  flex-direction: row;
  gap: 16px;

  .MuiChip-root,
  .MuiSvgIcon-root {
    align-self: center;
  }

  .MuiSvgIcon-root {
    transform: rotate(180deg);
    transition: transform 300ms;
  }

  &:hover {
    .MuiSvgIcon-root {
      transform: rotate(180deg) translateX(-2px);
    }
  }

  ${(props) =>
    props.isAvailable &&
    css`
      cursor: pointer;
    `}

  ${(props) =>
    !props.isAvailable &&
    css`
      background-color: ${smokeLightest(props)};
      pointer-events: none;

      .MuiChip-root {
        .MuiChip-label {
          color: ${inkLight(props)};
        }
      }

      .MuiSvgIcon-root {
        color: ${smokeDark(props)};
      }
    `}
`;

export const SectionContent = styled.div`
  flex: 1;

  h3 {
    ${textBody500};
    margin: 0 0 4px;
  }

  p {
    ${textBody4002Lines};
    color: ${inkLight};
    margin: 0;
  }
`;
