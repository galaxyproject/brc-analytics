import React, { useEffect, useState, useMemo } from "react";
import { Alert, Skeleton, Stack, ThemeProvider } from "@mui/material";
import {
  createViewState,
  JBrowseLinearGenomeView,
} from "@jbrowse/react-linear-genome-view2";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import {
  convertToLinearGenomeViewConfig,
  getConfigErrorMessage,
  isValidConfigUrl,
  loadJBrowseConfig,
} from "./utils";
import { JBrowseProps } from "./types";
import { mergeAppTheme } from "app/theme/theme";

/**
 * JBrowse genome browser component with isolated theme.
 * Uses JBrowse's own theme wrapped in a ThemeProvider to ensure all
 * required MUI palette colors are present for JBrowse components.
 *
 * @param props - Component props
 * @param props.accession - Assembly accession ID
 * @param props.configUrl - URL to JBrowse configuration JSON
 * @returns Rendered JBrowse Linear Genome View component
 */
export const JBrowse = ({
  accession,
  configUrl,
}: JBrowseProps): JSX.Element => {
  const [viewState, setViewState] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create and memoize JBrowse theme to override parent theme
  const jbrowseTheme = useMemo(() => createJBrowseTheme(), []);

  useEffect(() => {
    async function initializeJBrowse(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        if (!isValidConfigUrl(configUrl)) {
          throw new Error("Invalid JBrowse configuration URL");
        }

        const rawConfig = await loadJBrowseConfig(configUrl);
        const config = convertToLinearGenomeViewConfig(rawConfig);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JBrowse config type is complex and external
        const state = createViewState(config as any);
        setViewState(state);
      } catch (err) {
        const message = getConfigErrorMessage(
          accession,
          err instanceof Error ? err : undefined
        );
        setError(message);
        console.error(message, err);
      } finally {
        setLoading(false);
      }
    }

    initializeJBrowse();
  }, [accession, configUrl]);

  if (loading) {
    return (
      <Stack gap={2}>
        <Skeleton height={48} variant="rectangular" />
        <Skeleton height={400} variant="rectangular" />
      </Stack>
    );
  }

  if (error || !viewState) {
    return <Alert severity="error">{error || "Failed to initialize"}</Alert>;
  }

  return (
    <ThemeProvider
      theme={(outerTheme) => mergeAppTheme(outerTheme, jbrowseTheme)}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- JBrowse viewState type is complex and external */}
      <JBrowseLinearGenomeView viewState={viewState as any} />
    </ThemeProvider>
  );
};
