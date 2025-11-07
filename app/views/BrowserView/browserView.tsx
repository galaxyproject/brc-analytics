import { Fragment } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { BRCDataCatalogGenome } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import dynamic from "next/dynamic";
import { GA2AssemblyEntity } from "app/apis/catalog/ga2/entities";

// Load JBrowse only on client-side to avoid SSR issues
const JBrowse = dynamic(
  () =>
    import("../../components/Entity/components/JBrowse/jbrowse").then(
      (mod) => mod.JBrowse
    ),
  { ssr: false }
);

/**
 * Props interface for the BrowserView component
 * @interface BrowserViewProps
 * @property {BRCDataCatalogGenome | GA2AssemblyEntity} assembly - The assembly object containing genome or assembly information
 */
export interface BrowserViewProps {
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity;
}

/**
 * Browser view component for displaying JBrowse genome browser.
 * @param props - Browser view props.
 * @param props.assembly - Assembly entity with genome data.
 * @returns Browser view JSX.
 */
export const BrowserView = ({ assembly }: BrowserViewProps): JSX.Element => {
  // Check if assembly has JBrowse config
  if (!assembly.jbrowseConfigUrl) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="info">
          Genome browser is not available for this assembly.
        </Alert>
      </Box>
    );
  }

  return (
    <Fragment>
      <Stack gap={2} sx={{ height: "100%", width: "100%" }}>
        {/* JBrowse browser */}
        <JBrowse
          accession={assembly.accession}
          configUrl={assembly.jbrowseConfigUrl}
        />

        {/* Additional assembly info */}
        {assembly.ucscBrowserUrl && (
          <Box sx={{ paddingBottom: 2, paddingX: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Alternative browsers:{" "}
              <a
                href={assembly.ucscBrowserUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                UCSC Genome Browser
              </a>
            </Typography>
          </Box>
        )}
      </Stack>
    </Fragment>
  );
};
