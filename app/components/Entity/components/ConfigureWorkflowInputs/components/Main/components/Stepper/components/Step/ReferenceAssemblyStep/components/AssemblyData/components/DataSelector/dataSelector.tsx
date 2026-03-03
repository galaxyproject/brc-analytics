import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Button, Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { StyledPaper } from "./dataSelector.styles";
import { Props } from "./types";

/**
 * Data selector component prompting the user to browse and select an assembly.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onOpen - Callback to open the assembly selector dialog.
 * @returns Data selector component or null if an assembly is already selected.
 */
export const DataSelector = ({
  configuredInput,
  onOpen,
}: Props): JSX.Element | null => {
  if (configuredInput.referenceAssembly) return null;
  return (
    <StyledPaper elevation={0}>
      <Stack spacing={1}>
        <Typography
          component="div"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
        >
          No Reference Assembly Selected
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          Browse to find and select an assembly
        </Typography>
      </Stack>
      <Button {...BUTTON_PROPS.PRIMARY_CONTAINED} onClick={onOpen}>
        Browse
      </Button>
    </StyledPaper>
  );
};
