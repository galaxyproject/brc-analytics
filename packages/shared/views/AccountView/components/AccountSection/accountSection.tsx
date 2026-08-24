import {
  Alert,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * One titled section of the account workspace, with its own loading, error
 * and empty handling so a failure in one section cannot blank the others.
 * @param props - Component props.
 * @param props.action - Optional control rendered beside the heading.
 * @param props.children - The section's records.
 * @param props.count - Number of records, shown beside the heading.
 * @param props.emptyState - Shown when there is nothing and no error.
 * @param props.error - Load failure, shown in place of the empty state.
 * @param props.id - Anchor id and heading association.
 * @param props.isLoading - Whether the section is still loading.
 * @param props.title - Section heading.
 * @returns the section element.
 */
export function AccountSection({
  action,
  children,
  count,
  emptyState,
  error,
  id,
  isLoading,
  title,
}: Props): JSX.Element {
  const headingId = `${id}-heading`;

  function renderBody(): JSX.Element {
    if (isLoading) {
      return (
        <Stack alignItems="center" py={4}>
          <CircularProgress aria-label="Loading" size={28} />
        </Stack>
      );
    }
    // An error takes precedence over the empty state: a failed load is not
    // evidence the user has nothing saved. When there are records to show
    // alongside it -- e.g. a failed row action -- keep them visible under the
    // alert rather than replacing them; only a resource-level failure with
    // nothing loaded collapses to the alert alone.
    if (error) {
      return (
        <Stack spacing={2}>
          <Alert severity="error">{error.message}</Alert>
          {children && <Stack spacing={2}>{children}</Stack>}
        </Stack>
      );
    }
    if (!children) return <>{emptyState}</>;
    return <Stack spacing={2}>{children}</Stack>;
  }

  return (
    <Stack aria-labelledby={headingId} component="section" id={id} spacing={2}>
      <Stack alignItems="center" direction="row" spacing={1.5}>
        <Typography component="h2" id={headingId} variant="h5">
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip label={String(count)} size="small" />
        )}
        <Stack flexGrow={1} />
        {action}
      </Stack>
      {renderBody()}
    </Stack>
  );
}
