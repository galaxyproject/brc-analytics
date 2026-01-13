import { MenuItem } from "@mui/material";
import { StyledSelect } from "./select.styles";
import { Props } from "./types";
import { COLUMN_TYPE } from "../../../../types";
import { SELECT_PROPS } from "./constants";
import { OPTIONS } from "./options";
import { isOptionDisabled } from "./utils";

const optionsMap = new Map(OPTIONS);

export const Select = ({
  classifications,
  columnName,
  columnType,
  onClassify,
}: Props): JSX.Element => {
  console.log(columnName, columnType);
  return (
    <StyledSelect
      {...SELECT_PROPS}
      displayEmpty
      onChange={(e) => onClassify(columnName, e.target.value as COLUMN_TYPE)}
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
