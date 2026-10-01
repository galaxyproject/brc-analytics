import { ButtonPrimary } from "@databiosphere/findable-ui/lib/components/common/Button/components/ButtonPrimary/buttonPrimary";
import { AlertIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/AlertIcon/alertIcon";
import { SectionActions } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import {
  PRIORITY,
  StatusIcon,
} from "@databiosphere/findable-ui/lib/components/common/StatusIcon/statusIcon";
import {
  ErrorLayout,
  ErrorSection,
  SectionContent,
  Error as StyledError,
} from "@databiosphere/findable-ui/lib/components/Error/error.styles";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import Link from "next/link";
import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Friendly not-found state for a stale, unknown or unavailable workflow URL.
 * Rendered in place of the workflow view when the `trsId` doesn't name a
 * workflow the user may see, instead of surfacing the generic error page.
 * @param props - Component props.
 * @param props.entityContext - Noun for the entity the workflow was requested for (e.g. "assembly"); omitted when the workflow was requested on its own.
 * @param props.href - URL of the available-workflows listing to return to.
 * @returns Workflow not-found element.
 */
export const WorkflowNotFound = ({
  entityContext,
  href,
}: Props): JSX.Element => {
  const { dimensions } = useLayoutDimensions();
  return (
    <ErrorLayout offset={dimensions.header.height}>
      <StyledError>
        <ErrorSection>
          <StatusIcon priority={PRIORITY.MEDIUM} StatusIcon={AlertIcon} />
          <SectionContent>
            <Typography
              component="h1"
              variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XLARGE}
            >
              Workflow not found
            </Typography>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_400}>
              The requested workflow isn&apos;t available
              {entityContext ? ` for this ${entityContext}` : ""}. It may have
              been removed, or the link may be out of date.
            </Typography>
          </SectionContent>
          <SectionActions>
            <ButtonPrimary component={Link} href={href}>
              View Available Workflows
            </ButtonPrimary>
          </SectionActions>
        </ErrorSection>
      </StyledError>
    </ErrorLayout>
  );
};
