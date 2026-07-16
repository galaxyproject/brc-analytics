import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Fragment, JSX } from "react";
import { SectionsProps } from "./types";

export const Sections = ({
  children,
  className,
  Paper: PaperComponent,
}: SectionsProps): JSX.Element => {
  const Paper = PaperComponent ?? Fragment;
  const paperProps = PaperComponent ? { className } : {};
  return (
    <Paper {...paperProps}>
      <GridPaper>{children}</GridPaper>
    </Paper>
  );
};
