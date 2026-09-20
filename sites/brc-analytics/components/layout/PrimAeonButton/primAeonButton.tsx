import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import { Button } from "@mui/material";
import { type JSX } from "react";

/**
 * Header link-out to PrimAeon, the browser app for HyphAeon selection
 * analysis. Styled as a quiet text link with an outbound arrow — a link that
 * leaves the app, not an in-app action — and only where the header socials
 * render (`lg` and up) so it sits beside them.
 * @returns PrimAeon link-out button.
 */
export function PrimAeonButton(): JSX.Element {
  return (
    <Button
      color="inherit"
      endIcon={<ArrowOutwardRoundedIcon fontSize="small" />}
      href="https://primaeon.org"
      rel="noopener noreferrer"
      size="small"
      sx={{ display: { lg: "inline-flex", xs: "none" }, textTransform: "none" }}
      target="_blank"
      variant="text"
    >
      PrimAeon.org
    </Button>
  );
}
