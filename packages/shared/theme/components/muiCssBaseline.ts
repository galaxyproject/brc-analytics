import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { type Components } from "@mui/material";

export const MuiCssBaseline: Components["MuiCssBaseline"] = {
  styleOverrides: { body: { font: FONT.BODY_LARGE_400_2_LINES } },
};
