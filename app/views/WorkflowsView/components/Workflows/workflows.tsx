import { FilterButton } from "@databiosphere/findable-ui/lib/components/Index/components/EntityView/components/controls/FilterButton/filterButton";
import { Title } from "@databiosphere/findable-ui/lib/components/Index/components/EntityView/components/layout/Title/title";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import React, { JSX } from "react";
import { Card } from "./components/Card/card";
import { Props } from "./types";
import { StyledContainer, StyledStack } from "./workflows.styles";

/**
 * Component rendering the workflow grid view.
 * @param props - Props.
 * @param props.table - Table.
 * @returns Workflows grid.
 */
export const Workflows = ({ table }: Props): JSX.Element => {
  const { spacing } = useLayoutSpacing();
  const { getRowModel } = table;
  const { rows } = getRowModel();
  return (
    <StyledContainer maxWidth={false} {...spacing}>
      <StyledStack useFlexGap>
        <Title />
        <FilterButton />
      </StyledStack>
      {rows.map((row, i) => (
        <Card key={`${row.id}-${i}`} row={row} />
      ))}
    </StyledContainer>
  );
};
