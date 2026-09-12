import { Link as MuiLink, Typography } from "@mui/material";
import { AccountCard } from "@repo/shared/views/AccountView/components/AccountCard/accountCard";
import { AccountSection } from "@repo/shared/views/AccountView/components/AccountSection/accountSection";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Workflows this user handed off to Galaxy.
 *
 * Deliberately not "runs" and deliberately no status: the record ends at the
 * handoff, so anything past that would be a claim we cannot back.
 * @param props - Component props.
 * @param props.resource - Launches list state, owned by AccountView.
 * @returns the section element.
 */
export function LaunchesSection({ resource }: Props): JSX.Element {
  const { error, isLoading, items } = resource;

  return (
    <AccountSection
      count={items.length}
      emptyState={
        <Typography color="text.secondary" variant="body2">
          Workflows you send to Galaxy are listed here so you can find your way
          back to them.
        </Typography>
      }
      error={error}
      id="launches"
      isLoading={isLoading}
      title="Launches"
    >
      {items.length > 0
        ? items.map((launch) => (
            <AccountCard
              actions={
                <MuiLink
                  href={launch.handoff_url}
                  rel="noreferrer"
                  target="_blank"
                  underline="hover"
                >
                  Open in Galaxy
                </MuiLink>
              }
              key={launch.id}
              subtitle={
                launch.assembly_accession
                  ? `${launch.assembly_accession} -- launched ${new Date(launch.created_at).toLocaleString()}`
                  : `Launched ${new Date(launch.created_at).toLocaleString()}`
              }
              title={launch.workflow_trs_id}
            />
          ))
        : undefined}
    </AccountSection>
  );
}
