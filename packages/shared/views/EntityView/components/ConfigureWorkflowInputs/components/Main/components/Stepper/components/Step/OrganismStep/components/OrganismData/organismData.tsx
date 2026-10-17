import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Fragment, type JSX } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { OrganismSelector } from "./components/OrganismSelector/organismSelector";
import { OrganismSummary } from "./components/OrganismSummary/organismSummary";
import { type Props } from "./types";

/**
 * Organism data component managing the selector dialog and summary display.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.table - Organism table instance.
 * @returns Organism data component with selector and summary.
 */
export const OrganismData = ({
  configuredInput,
  table,
}: Props): JSX.Element => {
  const dialog = useDialog();
  return (
    <Fragment>
      <DataSelector configuredInput={configuredInput} onOpen={dialog.onOpen} />
      <OrganismSelector
        onClose={dialog.onClose}
        open={dialog.open}
        table={table}
      />
      <OrganismSummary
        configuredInput={configuredInput}
        onEdit={dialog.onOpen}
        table={table}
      />
    </Fragment>
  );
};
