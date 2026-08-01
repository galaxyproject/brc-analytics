import { type KeyValueElTypeProps } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyValueElType/keyValueElType";
import { type ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { Grid, type GridProps } from "@mui/material";
import { type JSX } from "react";

export const KeyValueElType = ({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `keyValue` is unused.
  keyValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `keyValueFn` is unused.
  keyValueFn,
  ...props /* Mui Grid Props */
}: ChildrenProps &
  GridProps &
  Pick<KeyValueElTypeProps, "keyValue" | "keyValueFn">): JSX.Element => {
  return (
    <Grid container direction="column" gap={1} {...props}>
      {children}
    </Grid>
  );
};
