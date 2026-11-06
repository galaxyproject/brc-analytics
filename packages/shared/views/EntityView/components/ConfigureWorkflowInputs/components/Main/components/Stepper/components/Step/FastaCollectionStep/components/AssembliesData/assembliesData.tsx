import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Fragment, type JSX } from "react";
import { AssembliesSelector } from "./components/AssembliesSelector/assembliesSelector";
import { AssembliesSummary } from "./components/AssembliesSummary/assembliesSummary";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { type Props } from "./types";

/**
 * Assemblies data component managing the selector dialog and summary display.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.table - Assemblies table instance.
 * @param props.workflow - Workflow entity.
 * @returns Assemblies data component with selector and summary.
 */
export const AssembliesData = ({
  configuredInput,
  onConfigure,
  stepKey,
  table,
  workflow,
}: Props): JSX.Element => {
  const dialog = useDialog();
  return (
    <Fragment>
      <DataSelector
        assemblyCount={table.getCoreRowModel().rows.length}
        configuredInput={configuredInput}
        onOpen={dialog.onOpen}
        workflow={workflow}
      />
      <AssembliesSelector
        fastaCollection={configuredInput.fastaCollection}
        onClose={dialog.onClose}
        onConfigure={onConfigure}
        open={dialog.open}
        referenceAssembly={configuredInput.referenceAssembly}
        stepKey={stepKey}
        table={table}
        workflow={workflow}
      />
      <AssembliesSummary
        configuredInput={configuredInput}
        onEdit={dialog.onOpen}
        table={table}
      />
    </Fragment>
  );
};
