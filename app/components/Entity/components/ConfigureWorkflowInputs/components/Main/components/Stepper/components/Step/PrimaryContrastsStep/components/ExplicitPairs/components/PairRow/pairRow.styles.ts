import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Select, SelectProps, Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  align-items: center;
  width: 100%;
`;

export const StyledSelect = styled(Select)`
  flex: 1;
  height: 36px;

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
