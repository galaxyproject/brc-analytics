import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Button,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import React, { JSX } from "react";
import { StyledCard } from "./card.styles";
import { Props } from "./types";
import Link from "next/link";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { ROUTES } from "routes/constants";

/**
 * Renders a card with workflow information and a configure button.
 * @param props - Props.
 * @param props.row - Row.
 * @returns Card.
 */
export const Card = ({ row }: Props): JSX.Element => {
  return (
    <StyledCard component={RoundedPaper} data-testid="viz-card">
      <CardContent>
        <Stack gap={2} useFlexGap>
          <Stack gap={1} useFlexGap>
            <Typography
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
            >
              {row.original.category}
            </Typography>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
              {row.original.workflowName}
            </Typography>
          </Stack>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
          >
            {row.original.workflowDescription}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          color={BUTTON_PROPS.COLOR.PRIMARY}
          component={Link}
          href={ROUTES.WORKFLOWS}
          variant={BUTTON_PROPS.VARIANT.CONTAINED}
        >
          Configure
        </Button>
      </CardActions>
    </StyledCard>
  );
};
