import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Fragment, type JSX } from "react";
import { type SectionsProps } from "./types";

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
