import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/src/styles/common/mui/typography";
import { ChevronRightRounded } from "@mui/icons-material";
import {
  CardActionArea,
  CardActions,
  CardContent,
  IconButton,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { JSX } from "react";
import { ROUTES } from "../../../../../routes/constants";
import { Props } from "../../types";
import { StyledCard } from "./main.styles";

export const Main = ({ entityId }: Props): JSX.Element => {
  return (
    <BackPageContentMainColumn>
      <StyledCard component={FluidPaper}>
        <CardActionArea component={Link} href="/workflows">
          <CardContent>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
              Select a Workflow
            </Typography>
            <Typography
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
            >
              Choose an analysis workflow in Galaxy using this assembly as the
              reference. You may add ENA reads and UCSC genome tracks. Launching
              the analysis will create a new Galaxy history with the selected
              data.
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton>
              <ChevronRightRounded />
            </IconButton>
          </CardActions>
        </CardActionArea>
      </StyledCard>
      <StyledCard component={FluidPaper}>
        <CardActionArea
          component={Link}
          href={replaceParameters(ROUTES.ANALYZE_CUSTOM_WORKFLOW, { entityId })}
        >
          <CardContent>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
              Custom Analysis
            </Typography>
            <Typography
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
            >
              Send this assembly, related UCSC Browser tracks, and selected ENA
              read runs to a Galaxy history for analysis with your workflow.
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton>
              <ChevronRightRounded />
            </IconButton>
          </CardActions>
        </CardActionArea>
      </StyledCard>
    </BackPageContentMainColumn>
  );
};
