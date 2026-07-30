import { isClientSideNavigation } from "@databiosphere/findable-ui/lib/components/Links/common/utils";
import { CardActionArea as MCardActionArea } from "@mui/material";
import { type JSX } from "react";
import type { Props } from "./types";
import { getLinkComponent, getRelAttribute, getTargetAttribute } from "./utils";

export const CardActionArea = ({
  children,
  className,
  href,
}: Props): JSX.Element => {
  if (!href)
    return (
      <MCardActionArea className={className} disabled>
        {children}
      </MCardActionArea>
    );

  const isInternalLink = isClientSideNavigation(href);

  return (
    <MCardActionArea
      className={className}
      LinkComponent={getLinkComponent(isInternalLink)}
      href={href}
      rel={getRelAttribute(isInternalLink)}
      target={getTargetAttribute(isInternalLink)}
    >
      {children}
    </MCardActionArea>
  );
};
