import { Stack, Typography } from "@mui/material";
import { type JSX } from "react";
import { StyledCard } from "./accountCard.styles";
import type { Props } from "./types";

/**
 * One record in an account section.
 * @param props - Component props.
 * @param props.actions - Buttons or links for this record.
 * @param props.children - Extra detail lines.
 * @param props.subtitle - Secondary line under the title.
 * @param props.title - Primary label.
 * @returns the card element.
 */
export function AccountCard({
  actions,
  children,
  subtitle,
  title,
}: Props): JSX.Element {
  return (
    <StyledCard>
      <Stack spacing={1}>
        <Typography component="h3" variant="subtitle1">
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>
        )}
        {children}
        {actions && (
          <Stack direction="row" pt={1} spacing={1}>
            {actions}
          </Stack>
        )}
      </Stack>
    </StyledCard>
  );
}
