import {
  LineButton,
  LineRail,
  MatrixCell,
  MatrixGap,
  MatrixHint,
  MatrixScroll,
  MatrixTable,
} from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexPicker.styles";
import {
  axisOptions,
  type IndexAxisOption,
  sortIndexes,
} from "@repo/shared/components/LoganSearch/utils";
import {
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface IndexMatrixProps {
  id?: string;
  indexes: string[];
  onChange: (selected: string[]) => void;
  selected: string[];
}

// A spot in the grid. Row -1 is the column labels and column -1 the row
// labels, so (-1, -1) is the corner's All.
interface Position {
  col: number;
  row: number;
}

const MOVES: Record<string, [number, number]> = {
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
};

/**
 * The share of a line that is selected, for its rail.
 * @param line - The registered indexes in a row or column.
 * @param picked - The current selection.
 * @returns A width as a CSS percentage.
 */
function railWidth(line: string[], picked: Set<string>): string {
  const on = line.filter((index) => picked.has(index)).length;
  return `${line.length ? (on / line.length) * 100 : 0}%`;
}

/**
 * Every registered index as one cell of an organism-by-library grid.
 *
 * Click a cell, click a row or column label to take or drop the whole line,
 * or drag across cells to paint them all the way the first one went. The
 * grid is one tab stop: arrow keys move between cells and labels, and Space
 * or Enter toggles, the ARIA grid pattern.
 * @param props - Component props.
 * @param props.id - Id for the grid, so a control can point at it.
 * @param props.indexes - Every registered index name.
 * @param props.onChange - Called with the new selection, sorted.
 * @param props.selected - The chosen index names.
 * @returns The matrix.
 */
export const IndexMatrix = ({
  id,
  indexes,
  onChange,
  selected,
}: IndexMatrixProps): JSX.Element => {
  const divisions = useMemo(() => axisOptions(indexes, "division"), [indexes]);
  const strategies = useMemo(() => axisOptions(indexes, "strategy"), [indexes]);
  const registered = useMemo(() => new Set(indexes), [indexes]);
  const picked = new Set(selected);

  // A drag fires pointerenter faster than the parent re-renders, so the
  // selection being painted is kept here rather than read from props.
  const latest = useRef(selected);
  latest.current = selected;
  // While a drag is on: whether it is turning cells on or off.
  const painting = useRef<boolean | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [hover, setHover] = useState<Position | null>(null);
  const [focus, setFocus] = useState<Position>(() => {
    const first = indexes.find((index) => selected.includes(index));
    const [strategy, division] = first ? split(first) : ["", ""];
    return {
      col: Math.max(
        0,
        strategies.findIndex((option) => option.code === strategy)
      ),
      row: Math.max(
        0,
        divisions.findIndex((option) => option.code === division)
      ),
    };
  });

  useEffect(() => {
    const stop = (): void => {
      painting.current = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return (): void => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  /**
   * The registered index at a grid position, if there is one.
   * @param row - Division row.
   * @param col - Strategy column.
   * @returns The index name, or undefined for a hole in the grid.
   */
  const cellAt = (row: number, col: number): string | undefined => {
    const name = `${strategies[col]?.code}_${divisions[row]?.code}`;
    return registered.has(name) ? name : undefined;
  };

  const rowLine = (row: number): string[] =>
    strategies
      .map((_, col) => cellAt(row, col))
      .filter((index): index is string => Boolean(index));
  const colLine = (col: number): string[] =>
    divisions
      .map((_, row) => cellAt(row, col))
      .filter((index): index is string => Boolean(index));

  /**
   * Hand the parent a new selection.
   * @param next - The new set.
   */
  const commit = (next: Set<string>): void => {
    const sorted = sortIndexes([...next]);
    latest.current = sorted;
    onChange(sorted);
  };

  /**
   * Take a whole line, or drop it if it is already all in.
   * @param line - The indexes in a row, a column, or the whole grid.
   */
  const toggleLine = (line: string[]): void => {
    const next = new Set(latest.current);
    const allIn = line.every((index) => next.has(index));
    for (const index of line) {
      if (allIn) next.delete(index);
      else next.add(index);
    }
    commit(next);
  };

  /**
   * Set one cell on or off.
   * @param index - The cell's index name.
   * @param on - Whether it should be included.
   */
  const setCell = (index: string, on: boolean): void => {
    const next = new Set(latest.current);
    if (on === next.has(index)) return;
    if (on) next.add(index);
    else next.delete(index);
    commit(next);
  };

  const focusable = (row: number, col: number): boolean =>
    row === -1 || col === -1 || Boolean(cellAt(row, col));

  /**
   * Move focus with the arrow keys, stepping over holes in the grid.
   * @param event - The key event from anywhere in the grid.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    const move = MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    // Read from the element the key came from rather than from state, which
    // may not have caught up with a focus that moved this tick.
    const from = (event.target as HTMLElement).dataset.pos ?? "";
    let [row, col] = from
      ? from.split(":").map(Number)
      : [focus.row, focus.col];
    for (;;) {
      row += move[0];
      col += move[1];
      if (row < -1 || row >= divisions.length) return;
      if (col < -1 || col >= strategies.length) return;
      if (focusable(row, col)) break;
    }
    setFocus({ col, row });
    tableRef.current
      ?.querySelector<HTMLElement>(`[data-pos="${row}:${col}"]`)
      ?.focus();
  };

  const tabIndex = (row: number, col: number): number =>
    focus.row === row && focus.col === col ? 0 : -1;
  const crossed = (row: number, col: number): boolean =>
    hover !== null && (hover.row === row || hover.col === col);

  return (
    <MatrixScroll>
      <MatrixTable
        aria-label="Indexes by organism group and library type"
        id={id}
        onKeyDown={onKeyDown}
        onPointerLeave={(): void => setHover(null)}
        ref={tableRef}
        role="grid"
      >
        <thead>
          <tr>
            <th>
              <LineButton
                data-full={picked.size === registered.size}
                data-pos="-1:-1"
                onClick={(): void => toggleLine(indexes)}
                onFocus={(): void => setFocus({ col: -1, row: -1 })}
                tabIndex={tabIndex(-1, -1)}
                type="button"
              >
                All
              </LineButton>
            </th>
            {strategies.map((option, col) => (
              <th key={option.code} scope="col">
                <LineHeader
                  crossed={hover?.col === col}
                  line={colLine(col)}
                  onClick={(): void => toggleLine(colLine(col))}
                  onFocus={(): void => setFocus({ col, row: -1 })}
                  option={option}
                  picked={picked}
                  pos={`-1:${col}`}
                  short
                  tabIndex={tabIndex(-1, col)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {divisions.map((division, row) => (
            <tr key={division.code}>
              <th scope="row">
                <LineHeader
                  crossed={hover?.row === row}
                  line={rowLine(row)}
                  onClick={(): void => toggleLine(rowLine(row))}
                  onFocus={(): void => setFocus({ col: -1, row })}
                  option={division}
                  picked={picked}
                  pos={`${row}:-1`}
                  tabIndex={tabIndex(row, -1)}
                />
              </th>
              {strategies.map((strategy, col) => {
                const index = cellAt(row, col);
                return (
                  <td key={strategy.code} role="gridcell">
                    {index ? (
                      <MatrixCell
                        aria-label={`${strategy.label}, ${division.label}`}
                        aria-pressed={picked.has(index)}
                        data-crossed={crossed(row, col)}
                        data-pos={`${row}:${col}`}
                        onClick={(event): void => {
                          // Pointer clicks are handled on pointerdown so a
                          // drag can start there. A click with no pointer
                          // behind it is the keyboard or assistive tech.
                          if (event.detail === 0)
                            setCell(index, !latest.current.includes(index));
                        }}
                        onFocus={(): void => setFocus({ col, row })}
                        onPointerDown={(event: PointerEvent): void => {
                          // Primary button or a touch; not a right click.
                          if (event.button > 0) return;
                          const on = !latest.current.includes(index);
                          painting.current = on;
                          setCell(index, on);
                        }}
                        onPointerEnter={(): void => {
                          setHover({ col, row });
                          if (painting.current !== null)
                            setCell(index, painting.current);
                        }}
                        tabIndex={tabIndex(row, col)}
                        title={index}
                        type="button"
                      />
                    ) : (
                      <MatrixGap
                        title={`No ${strategy.label.toLowerCase()} index for ${division.label.toLowerCase()}`}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </MatrixTable>
      <MatrixHint>
        Click a cell, or a row or column label for the whole line. Drag across
        cells to paint several at once.
      </MatrixHint>
    </MatrixScroll>
  );
};

/**
 * Split an index name into its strategy and division.
 * @param index - An index name.
 * @returns [strategy, division].
 */
function split(index: string): [string, string] {
  const separator = index.lastIndexOf("_");
  return [index.slice(0, separator), index.slice(separator + 1)];
}

/**
 * A row or column label: takes or drops its whole line.
 * @param props - Component props.
 * @param props.crossed - Whether the pointer is over a cell in this line.
 * @param props.line - The registered indexes in the line.
 * @param props.onClick - Toggles the line.
 * @param props.onFocus - Records the grid position as focused.
 * @param props.option - The axis value the line stands for.
 * @param props.picked - The current selection.
 * @param props.pos - Grid position, for arrow-key focus.
 * @param props.short - Use the narrow column label.
 * @param props.tabIndex - 0 for the grid's one tab stop, else -1.
 * @returns The label button.
 */
function LineHeader({
  crossed,
  line,
  onClick,
  onFocus,
  option,
  picked,
  pos,
  short = false,
  tabIndex,
}: {
  crossed: boolean;
  line: string[];
  onClick: () => void;
  onFocus: () => void;
  option: IndexAxisOption;
  picked: Set<string>;
  pos: string;
  short?: boolean;
  tabIndex: number;
}): JSX.Element {
  const full = line.length > 0 && line.every((index) => picked.has(index));
  const noun = line.length === 1 ? "index" : "indexes";
  return (
    <LineButton
      aria-label={`${option.label}, ${line.length} ${noun}`}
      aria-pressed={full}
      data-crossed={crossed}
      data-full={full}
      data-pos={pos}
      onClick={onClick}
      onFocus={onFocus}
      tabIndex={tabIndex}
      title={option.note ?? option.label}
      type="button"
    >
      {short ? (option.shortLabel ?? option.label) : option.label}
      <LineRail>
        <span style={{ width: railWidth(line, picked) }} />
      </LineRail>
    </LineButton>
  );
}
