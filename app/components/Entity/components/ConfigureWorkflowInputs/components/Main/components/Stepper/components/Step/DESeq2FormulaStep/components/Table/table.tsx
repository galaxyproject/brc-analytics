import { JSX } from "react";
import {
  Checkbox,
  Radio,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { StyledTableContainer } from "./table.styles";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { Props } from "./types";
import { COLUMN_TYPE_LABEL } from "./constants";
import { RadioCheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioCheckedIcon/radioCheckedIcon";
import { RadioUncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioUncheckedIcon/radioUncheckedIcon";
import { CheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/CheckedIcon/checkedIcon";
import { UncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UncheckedIcon/uncheckedIcon";
import { UncheckedDisabledIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UncheckedDisabledIcon/uncheckedDisabledIcon";

export const Table = ({
  columns,
  onConfigure,
  onSelectPrimary,
  onToggleCovariate,
  selection,
}: Props): JSX.Element => {
  return (
    <StyledTableContainer>
      <GridTable gridTemplateColumns="repeat(4, 1fr)">
        <TableHead>
          <TableRow>
            <TableCell>Column name</TableCell>
            <TableCell>Factor Type</TableCell>
            <TableCell>Primary</TableCell>
            <TableCell>Covariate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {columns.map(({ columnName, columnType }) => {
            const isPrimary = selection.primary === columnName;
            const isCovariate = selection.covariates.has(columnName);
            return (
              <TableRow key={columnName}>
                <TableCell>{columnName}</TableCell>
                <TableCell>{COLUMN_TYPE_LABEL.get(columnType)}</TableCell>
                <TableCell>
                  <Radio
                    aria-label={`Select ${columnName} as primary factor`}
                    checked={isPrimary}
                    checkedIcon={<RadioCheckedIcon />}
                    icon={<RadioUncheckedIcon />}
                    onChange={() => {
                      onSelectPrimary(columnName);
                      onConfigure({
                        primaryContrasts: null,
                        primaryFactor: columnName,
                      });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`Include ${columnName} as covariate`}
                    checked={isCovariate}
                    checkedIcon={<CheckedIcon />}
                    disabled={isPrimary}
                    icon={
                      isPrimary ? <UncheckedDisabledIcon /> : <UncheckedIcon />
                    }
                    onChange={() => onToggleCovariate(columnName)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </GridTable>
    </StyledTableContainer>
  );
};
