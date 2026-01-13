import { Select, SelectProps } from "@mui/material";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { css } from "@emotion/react";

export const StyledSelect = styled(Select)`
  height: 36px;
  max-width: 200px;

  ${({ value }: SelectProps) =>
    value === ""
      ? null
      : css`
          & .MuiOutlinedInput-input,
          .MuiSvgIcon-root {
            color: ${PALETTE.INK_MAIN};
          }
        `};
`;
