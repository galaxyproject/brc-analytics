import { IndexMatrix } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexMatrix";
import {
  MatrixPane,
  MatrixToggle,
  PickerLayout,
  ScopeCard,
  ScopeCards,
  ScopeCount,
  ScopeNote,
  ScopeOrigin,
  ScopeText,
  ScopeTitle,
} from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexPicker.styles";
import {
  indexPresets,
  selectIndexes,
} from "@repo/shared/components/LoganSearch/utils";
import { type JSX, useMemo, useState } from "react";

const MATRIX_ID = "logan-index-matrix";

interface IndexPickerProps {
  indexes: string[];
  onChange: (selected: string[]) => void;
  selected: string[];
}

/**
 * A count with its noun.
 * @param count - How many indexes.
 * @returns e.g. "1 index", "24 indexes".
 */
function indexCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "index" : "indexes"}`;
}

/**
 * Which indexes to search: a card per logan-search.org group this instance
 * can offer, beside the full matrix.
 *
 * A card lights up when the selection is exactly what it covers, however the
 * selection got there, so picking the same set by hand lights it too and a
 * tweak on the matrix turns it off. With no card lit, the matrix is the
 * selection. On a phone the matrix is too wide to sit open by default, so it
 * folds behind a toggle there.
 * @param props - Component props.
 * @param props.indexes - Every registered index name, sorted.
 * @param props.onChange - Called with the new selection, sorted.
 * @param props.selected - The chosen index names, sorted.
 * @returns The picker.
 */
export const IndexPicker = ({
  indexes,
  onChange,
  selected,
}: IndexPickerProps): JSX.Element => {
  const [matrixOpen, setMatrixOpen] = useState(false);
  const presets = useMemo(
    () =>
      indexPresets(indexes).map((preset) => ({
        ...preset,
        indexes: selectIndexes(indexes, preset.divisions, preset.strategies),
      })),
    [indexes]
  );
  const selectedKey = selected.join(",");
  const current = presets.find(
    (preset) => preset.indexes.join(",") === selectedKey
  );

  return (
    <PickerLayout>
      <ScopeCards aria-label="Index presets" role="group">
        {presets.map((preset) => (
          <ScopeCard
            aria-pressed={preset === current}
            key={preset.loganName}
            onClick={(): void => onChange(preset.indexes)}
            type="button"
          >
            <ScopeText>
              <ScopeTitle>{preset.label}</ScopeTitle>
              <ScopeNote>{preset.note}</ScopeNote>
              <ScopeCount>{indexCount(preset.indexes.length)}</ScopeCount>
              <ScopeOrigin>
                <span>logan-search.org:</span>
                <code>{preset.loganName}</code>
              </ScopeOrigin>
            </ScopeText>
          </ScopeCard>
        ))}
      </ScopeCards>
      <MatrixToggle
        aria-controls={MATRIX_ID}
        aria-expanded={matrixOpen}
        onClick={(): void => setMatrixOpen((open) => !open)}
        type="button"
      >
        {matrixOpen ? "Hide the matrix" : "Pick index by index"}
      </MatrixToggle>
      <MatrixPane data-open={matrixOpen}>
        <IndexMatrix
          id={MATRIX_ID}
          indexes={indexes}
          onChange={onChange}
          selected={selected}
        />
      </MatrixPane>
    </PickerLayout>
  );
};
