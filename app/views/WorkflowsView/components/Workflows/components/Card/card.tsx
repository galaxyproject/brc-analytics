import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import {
  Button,
  CardActions,
  CardContent,
  Chip,
  Link as MLink,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { JSX } from "react";
import { ROUTES } from "../../../../../../../routes/constants";
import { TruncatedText } from "../../../../../../components/common/TruncatedText/truncatedText";
import { CHIP_PROPS } from "../../../../../../components/Entity/components/AnalysisMethod/constants";
import { StyledCard } from "./card.styles";
import { Props } from "./types";

/**
 * Renders a card with workflow information and a configure button.
 * @param props - Props.
 * @param props.row - Row.
 * @returns Card.
 */
export const Card = ({ row }: Props): JSX.Element => {
  return (
    <StyledCard component={RoundedPaper}>
      <CardContent>
        <Stack spacing={2} useFlexGap>
          <Stack spacing={1} useFlexGap>
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
            <TruncatedText
              suffix={
                <MLink
                  href={`https://iwc.galaxyproject.org/workflow/${row.original.iwcId}`}
                  rel={REL_ATTRIBUTE.NO_OPENER_NO_REFERRER}
                  target={ANCHOR_TARGET.BLANK}
                >
                  Learn more
                </MLink>
              }
            >
              {row.original.workflowDescription}
            </TruncatedText>
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        {row.original.disabled ? (
          <Chip {...CHIP_PROPS} />
        ) : (
          <Button
            color={BUTTON_PROPS.COLOR.PRIMARY}
            component={Link}
            href={replaceParameters(ROUTES.WORKFLOW, {
              trsId: row.id,
            })}
            variant={BUTTON_PROPS.VARIANT.CONTAINED}
          >
            Configure
          </Button>
        )}
      </CardActions>
    </StyledCard>
  );
};
