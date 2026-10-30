import {
  SummaryCount,
  SummaryRail,
  SummaryRow,
} from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexPicker.styles";
import { type JSX } from "react";

interface IndexSummaryProps {
  selected: number;
  total: number;
}

/**
 * How much of the registry the next search covers: the count, and a rail the
 * same share wide. Sits beside the Search button, so what will run is read
 * where the click happens.
 * @param props - Component props.
 * @param props.selected - How many indexes are picked.
 * @param props.total - How many are registered.
 * @returns The summary.
 */
export const IndexSummary = ({
  selected,
  total,
}: IndexSummaryProps): JSX.Element => {
  const share = total ? Math.round((selected / total) * 100) : 0;
  return (
    <SummaryRow>
      <SummaryCount>
        {selected.toLocaleString()}{" "}
        <small>of {total.toLocaleString()} indexes</small>
      </SummaryCount>
      <SummaryRail aria-hidden="true">
        <span style={{ width: `${share}%` }} />
      </SummaryRail>
    </SummaryRow>
  );
};
