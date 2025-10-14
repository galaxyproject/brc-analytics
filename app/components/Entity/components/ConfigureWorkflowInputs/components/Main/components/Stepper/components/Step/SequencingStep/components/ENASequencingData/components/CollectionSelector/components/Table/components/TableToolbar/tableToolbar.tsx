import { Props } from "../../types";
import {
  StyledToolbar,
  StyledStack,
} from "@databiosphere/findable-ui/lib/components/Table/components/TableToolbar2/tableToolbar2.styles";
import { TableDownload } from "@databiosphere/findable-ui/lib/components/Table/components/TableFeatures/TableDownload/tableDownload";
import { ResultsSummary } from "./components/ResultsSummary/resultsSummary";

export const TableToolbar = ({ table }: Props): JSX.Element => {
  return (
    <StyledToolbar>
      <ResultsSummary table={table} />
      <StyledStack>
        <TableDownload table={table} />
      </StyledStack>
    </StyledToolbar>
  );
};
