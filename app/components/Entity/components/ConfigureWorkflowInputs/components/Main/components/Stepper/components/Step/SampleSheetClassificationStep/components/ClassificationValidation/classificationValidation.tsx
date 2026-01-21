import { CheckCircleRounded } from "@mui/icons-material";
import { Props } from "./types";
import { StyledFluidPaper } from "./classificationValidation.styles";
import { mapValidation } from "./utils";
import { Stack, Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { ErrorIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ErrorIcon/errorIcon";

export const ClassificationValidation = ({
  active,
  classifications,
}: Props): JSX.Element | null => {
  if (!active) return null;
  return (
    <StyledFluidPaper>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
        Validation Status
      </Typography>
      <Stack gap={3} useFlexGap>
        {mapValidation(classifications).map(([isValid, label]) => (
          <Stack key={label} direction="row" gap={1} useFlexGap>
            {isValid ? (
              <CheckCircleRounded
                color={SVG_ICON_PROPS.COLOR.SUCCESS}
                fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
              />
            ) : (
              <ErrorIcon
                color={SVG_ICON_PROPS.COLOR.ERROR}
                fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
              />
            )}
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </StyledFluidPaper>
  );
};
