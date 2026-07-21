import type { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { Link as MLink } from "@mui/material";
import type { LinkProps } from "next/link";
import Link from "next/link";
import { JSX } from "react";

export const AppLink = ({
  children,
  ...props /* Next LinkProps */
}: ChildrenProps & LinkProps): JSX.Element => {
  return (
    <MLink component={Link} {...props}>
      {children}
    </MLink>
  );
};
