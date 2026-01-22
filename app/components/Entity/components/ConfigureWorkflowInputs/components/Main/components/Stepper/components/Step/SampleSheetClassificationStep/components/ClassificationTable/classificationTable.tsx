import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { StyledTableContainer } from "./classificationTable.styles";
import { Props } from "./types";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { Select } from "./components/Select/select";
import { COLUMN_TYPE } from "../../types";

/**
 * Labels for auto-detected column types that don't appear in the dropdown.
 */
const AUTO_DETECTED_LABELS: Partial<Record<COLUMN_TYPE, string>> = {
  [COLUMN_TYPE.FORWARD_FILE_MD5]: "MD5 Checksum (Forward)",
  [COLUMN_TYPE.REVERSE_FILE_MD5]: "MD5 Checksum (Reverse)",
};

/**
 * Check if a column type is auto-detected and should be read-only.
 * @param columnType - The column type to check.
 * @returns True if the column type is auto-detected (MD5 checksum).
 */
function isAutoDetectedType(columnType: COLUMN_TYPE | null): boolean {
  return columnType !== null && columnType in AUTO_DETECTED_LABELS;
}

export const ClassificationTable = ({
  classifications,
  onClassify,
  onConfigure,
}: Props): JSX.Element => {
  return (
    <StyledTableContainer>
      <GridTable gridTemplateColumns="1fr 1fr">
        <TableHead>
          <TableRow>
            <TableCell>Column name</TableCell>
            <TableCell>Column type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(classifications).map(([columnName, columnType]) => (
            <TableRow key={columnName}>
              <TableCell>{columnName}</TableCell>
              <TableCell>
                {isAutoDetectedType(columnType) ? (
                  <span style={{ color: "#666", fontStyle: "italic" }}>
                    {AUTO_DETECTED_LABELS[columnType!]}
                  </span>
                ) : (
                  <Select
                    classifications={classifications}
                    columnName={columnName}
                    columnType={columnType}
                    onClassify={onClassify}
                    onConfigure={onConfigure}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </GridTable>
    </StyledTableContainer>
  );
};
