import { StyledStack, StyledRoundedPaper } from "./tables.styles";
import { Props } from "./types";
import { Table } from "../Table/table";
import { NoResults } from "@databiosphere/findable-ui/lib/components/NoResults/noResults";

export const Tables = ({ table }: Props): JSX.Element => {
  const { getRowCount, getRowModel } = table;
  const { rows } = getRowModel();

  if (getRowCount() === 0) {
    return (
      <StyledStack>
        <NoResults Paper={StyledRoundedPaper} title="No Results" />
      </StyledStack>
    );
  }

  return (
    <StyledStack spacing={4} useFlexGap>
      {rows.map((row, i) => (
        <Table key={row.id} defaultExpanded={i === 0} row={row} table={table} />
      ))}
    </StyledStack>
  );
};
