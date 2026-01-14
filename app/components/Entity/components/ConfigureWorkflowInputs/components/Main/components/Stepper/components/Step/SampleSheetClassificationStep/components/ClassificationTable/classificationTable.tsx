import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { StyledTableContainer } from "./classificationTable.styles";
import { Props } from "./types";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { Select } from "./components/Select/select";

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
                <Select
                  classifications={classifications}
                  columnName={columnName}
                  columnType={columnType}
                  onClassify={onClassify}
                  onConfigure={onConfigure}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </GridTable>
    </StyledTableContainer>
  );
};
