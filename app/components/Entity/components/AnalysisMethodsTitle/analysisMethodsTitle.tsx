import { TEXT_HEADING } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Typography } from "@mui/material";

interface AnalysisMethodsTitleProps {
  title: React.ReactNode;
}

export const AnalysisMethodsTitle = ({
  title,
}: AnalysisMethodsTitleProps): JSX.Element => {
  return (
    <Typography color="ink.main" component="h2" variant={TEXT_HEADING}>
      {title}
    </Typography>
  );
};
