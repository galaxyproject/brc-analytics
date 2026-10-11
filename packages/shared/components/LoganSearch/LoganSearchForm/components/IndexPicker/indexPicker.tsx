import { IndexGlyph } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexGlyph";
import { IndexMatrix } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexMatrix";
import {
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
  defaultNote?: string;
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
 * can offer, and a Custom card that opens the full matrix.
 *
 * A card lights up when the selection is exactly what it covers, however the
 * selection got there, so picking the same set by hand lights it too and a
 * tweak on the matrix turns it off. Custom lights up for anything else.
 * @param props - Component props.
 * @param props.defaultNote - Why the untouched default is what it is, shown on
 * Custom until someone picks something.
 * @param props.indexes - Every registered index name, sorted.
 * @param props.onChange - Called with the new selection, sorted.
 * @param props.selected - The chosen index names, sorted.
 * @returns The picker.
 */
export const IndexPicker = ({
  defaultNote,
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

  let customCount = indexCount(selected.length);
  if (current) customCount = matrixOpen ? "Hide the matrix" : "Open the matrix";
  let customNote = "Pick indexes one by one on the full matrix.";
  if (defaultNote) customNote = defaultNote;
  if (matrixOpen) customNote = "Pick indexes on the matrix below.";

  return (
    <>
      <ScopeCards aria-label="Index scope" role="group">
        {presets.map((preset) => (
          <ScopeCard
            aria-pressed={preset === current}
            key={preset.loganName}
            onClick={(): void => onChange(preset.indexes)}
            type="button"
          >
            <IndexGlyph indexes={indexes} selected={preset.indexes} />
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
        <ScopeCard
          aria-controls={MATRIX_ID}
          aria-expanded={matrixOpen}
          data-current={!current}
          onClick={(): void => setMatrixOpen((open) => !open)}
          type="button"
        >
          <IndexGlyph indexes={indexes} selected={selected} />
          <ScopeText>
            <ScopeTitle>Custom</ScopeTitle>
            <ScopeNote>{customNote}</ScopeNote>
            <ScopeCount>{customCount}</ScopeCount>
          </ScopeText>
        </ScopeCard>
      </ScopeCards>
      {matrixOpen && (
        <IndexMatrix
          id={MATRIX_ID}
          indexes={indexes}
          onChange={onChange}
          selected={selected}
        />
      )}
    </>
  );
};
