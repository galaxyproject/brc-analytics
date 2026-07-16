import { SELECT_PROPS } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationTable/components/Select/constants";
import { OPTIONS } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationTable/components/Select/options";
import { StyledSelect } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationTable/components/Select/select.styles";
import { isOptionDisabled } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationTable/components/Select/utils";
import { COLUMN_TYPE } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { MenuItem } from "@mui/material";
import { JSX } from "react";
import { Props } from "./types";

const optionsMap = new Map(OPTIONS);

export const Select = ({
  classifications,
  columnName,
  columnType,
  onClassify,
  onConfigure,
}: Props): JSX.Element => {
  return (
    <StyledSelect
      {...SELECT_PROPS}
      displayEmpty
      onChange={(e) => {
        onClassify(columnName, e.target.value as COLUMN_TYPE);
        // Any change in classification should result in the design formula, primary factor, and primary contrasts being cleared.
        onConfigure({
          designFormula: null,
          primaryContrasts: null,
          primaryFactor: null,
        });
      }}
      renderValue={renderValue}
      value={columnType ?? ""}
    >
      {OPTIONS.map(([value, label]) => (
        <MenuItem
          disabled={isOptionDisabled(value, columnType, classifications)}
          key={value}
          value={value}
        >
          {label}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};

/**
 * Renders the value of the select.
 * @param value - The value to render.
 * @returns The rendered value.
 */
function renderValue(value: unknown): string {
  if (value === "") return "Select type";
  return optionsMap.get(value as COLUMN_TYPE) || "Select type";
}
