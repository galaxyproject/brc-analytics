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
 * Friendly unavailable state for a workflow URL. Rendered in place of the
 * workflow view when the `trsId` names a workflow the user may not see: one
 * that isn't loaded, is hidden by a feature flag, or isn't compatible with the
 * entity it was requested for. Shown instead of the generic error page.
 * @param props - Component props.
 * @param props.entityContext - Noun for the entity the workflow was requested for (e.g. "assembly"); omitted when the workflow was requested on its own.
 * @param props.href - URL of the available-workflows listing to return to.
 * @returns Workflow unavailable element.
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
              Workflow not available
            </Typography>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_400}>
              {entityContext ? (
                <>
                  The requested workflow isn&apos;t available for this{" "}
                  {entityContext}. It may not be compatible with this{" "}
                  {entityContext}, or the link may be out of date.
                </>
              ) : (
                <>
                  The requested workflow isn&apos;t available. It may not be
                  released yet, or the link may be out of date.
                </>
              )}
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
