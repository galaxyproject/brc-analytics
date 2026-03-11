import { SearchOffIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SearchOffIcon/searchOffIcon";
import {
  PRIORITY,
  StatusIcon,
} from "@databiosphere/findable-ui/lib/components/common/StatusIcon/statusIcon";
import { FilterButton } from "@databiosphere/findable-ui/lib/components/Index/components/EntityView/components/controls/FilterButton/filterButton";
import { Title } from "@databiosphere/findable-ui/lib/components/Index/components/EntityView/components/layout/Title/title";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { JSX } from "react";
import { Card } from "./components/Card/card";
import { Props } from "./types";
import {
  StyledContainer,
  StyledRoundedPaper,
  StyledStack,
} from "./workflows.styles";

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
      {rows.length === 0 ? (
        <StyledRoundedPaper elevation={0}>
          <StatusIcon priority={PRIORITY.LOW} StatusIcon={SearchOffIcon} />
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}
          >
            No results found
          </Typography>
        </StyledRoundedPaper>
      ) : (
        rows.map((row) => (
          <Card
            key={`${row.original.category}-${row.original.workflowName}`}
            row={row}
          />
        ))
      )}
    </StyledContainer>
  );
};
