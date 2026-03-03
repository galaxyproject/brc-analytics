import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Fragment, JSX } from "react";
import { AssemblySelector } from "./components/AssemblySelector/assemblySelector";
import { AssemblySummary } from "./components/AssemblySummary/assemblySummary";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { Props } from "./types";

/**
 * Assembly data component managing the selector dialog and summary display.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.table - Assembly table instance.
 * @returns Assembly data component with selector and summary.
 */
export const AssemblyData = ({
  configuredInput,
  table,
}: Props): JSX.Element => {
  const dialog = useDialog();
  return (
    <Fragment>
      <DataSelector configuredInput={configuredInput} onOpen={dialog.onOpen} />
      <AssemblySelector
        onClose={dialog.onClose}
        open={dialog.open}
        table={table}
      />
      <AssemblySummary
        configuredInput={configuredInput}
        onEdit={dialog.onOpen}
        table={table}
      />
    </Fragment>
  );
};
