import { Button, Typography } from "@mui/material";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import { AccountCard } from "@repo/shared/views/AccountView/components/AccountCard/accountCard";
import { AccountSection } from "@repo/shared/views/AccountView/components/AccountSection/accountSection";
import { useRouter } from "next/router";
import { type JSX, useCallback, useState } from "react";
import type { Props } from "./types";

/**
 * The user's assistant conversations, saved automatically.
 * @param props - Component props.
 * @param props.resource - Analyses list state, owned by AccountView.
 * @returns the section element.
 */
export function AnalysesSection({ resource }: Props): JSX.Element {
  const router = useRouter();
  const { error, isLoading, items, setItems } = resource;
  // Delete/open failures are local to this section -- a rejected request must
  // not be left as an unhandled promise rejection that tells the user nothing.
  const [actionError, setActionError] = useState<Error | null>(null);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      setActionError(null);
      try {
        await apiClient.deleteSavedAnalysis(id);
        setItems((current) => current.filter((item) => item.id !== id));
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err
            : new Error("Failed to delete saved analysis.")
        );
      }
    },
    [setItems]
  );

  const handleOpen = useCallback(
    async (id: string): Promise<void> => {
      setActionError(null);
      try {
        const opened = await apiClient.openSavedAnalysis(id);
        await router.push({
          pathname: "/assistant",
          query: { sessionId: opened.session_id },
        });
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err
            : new Error("Failed to open saved analysis.")
        );
      }
    },
    [router]
  );

  return (
    <AccountSection
      count={items.length}
      emptyState={
        <Typography color="text.secondary" variant="body2">
          Conversations with the assistant are saved here automatically while
          you are signed in.
        </Typography>
      }
      // The resource error wins when both are set: a failed load is more
      // fundamental than a failed row action.
      error={error ?? actionError}
      id="analyses"
      isLoading={isLoading}
      title="Analyses"
    >
      {items.length > 0
        ? items.map((analysis) => (
            <AccountCard
              actions={
                <>
                  <Button
                    onClick={() => void handleOpen(analysis.id)}
                    variant="contained"
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={() => void handleDelete(analysis.id)}
                    variant="text"
                  >
                    Delete
                  </Button>
                </>
              }
              key={analysis.id}
              subtitle={`Last active ${new Date(analysis.updated_at).toLocaleString()}`}
              title={analysis.title ?? "Untitled analysis"}
            />
          ))
        : undefined}
    </AccountSection>
  );
}
