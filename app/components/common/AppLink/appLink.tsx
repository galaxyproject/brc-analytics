import { JSX } from "react";
import { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { Link as MLink } from "@mui/material";
import Link from "next/link";
import { LinkProps } from "next/link";

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
