import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

interface AnalysisMethodsTitleProps {
  title: React.ReactNode;
}

export const AnalysisMethodsTitle = ({
  title,
}: AnalysisMethodsTitleProps): JSX.Element => {
  return (
    <Typography
      color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
      component="h2"
      variant={TYPOGRAPHY_PROPS.VARIANT.HEADING}
    >
      {title}
    </Typography>
  );
};
