import { JSX } from "react";
import { KeyValueElTypeProps } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/components/KeyValueElType/keyValueElType";
import { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { Grid, GridProps } from "@mui/material";

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
