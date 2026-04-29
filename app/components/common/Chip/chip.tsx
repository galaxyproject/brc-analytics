import { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { ChipProps, Chip as MChip } from "@mui/material";
import { JSX } from "react";

export const Chip = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- children is null for Mui ChipProps but is passed to the component via ComponentCreator see https://github.com/DataBiosphere/findable-ui/issues/552.
  children,
  ...props /* Mui ChipProps */
}: ChipProps & ChildrenProps): JSX.Element => {
  return <MChip {...props} />;
};
