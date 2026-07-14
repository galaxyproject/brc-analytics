import { ColumnDef } from "@tanstack/react-table";
import type { PangenomeMember } from "../../../../../../../apis/catalog/brc-analytics-catalog/common/pangenome";
import { RefCell } from "../../../../../../../components/Table/components/TableCell/components/RefCell/refCell";
import { AssemblyCell } from "../../../table/components/TableCell/components/AssemblyCell/assemblyCell";
import { SelectionTracksCell } from "../../../table/components/TableCell/components/SelectionTracksCell/selectionTracksCell";
import { ViewCell } from "../../../table/components/TableCell/components/ViewCell/viewCell";
import { renderLevel } from "./viewBuilder";

const ASSEMBLY: ColumnDef<PangenomeMember> = {
  accessorKey: "name",
  cell: AssemblyCell,
  header: "Assembly",
  meta: { header: "Assembly", width: { max: "1fr", min: "180px" } },
};

const LENGTH: ColumnDef<PangenomeMember> = {
  accessorKey: "length",
  // `length` is a display string ("29.05 Mb"), so sorting would be
  // lexicographic and wrong. Opt out until #1341 provides a numeric length.
  enableSorting: false,
  header: "Length",
  meta: { header: "Length", width: { max: "0.75fr", min: "132px" } },
};

const LEVEL: ColumnDef<PangenomeMember> = {
  // Sort by tier (levelFilledCount) to match the bar indicator, not the
  // free-text label — Genome (4) > Chromosome (3) > Scaffold (2) > Contig (1).
  accessorFn: (row) => row.levelFilledCount,
  cell: renderLevel,
  header: "Level",
  id: "level",
  meta: { header: "Level", width: { max: "0.75fr", min: "142px" } },
};

const REF: ColumnDef<PangenomeMember> = {
  accessorKey: "isRef",
  cell: RefCell,
  header: "Ref",
  id: "isRef",
  meta: { header: "Ref", width: { max: "0.75fr", min: "100px" } },
};

const SELECTION_TRACKS: ColumnDef<PangenomeMember> = {
  accessorKey: "hasSelectionTracks",
  cell: SelectionTracksCell,
  header: "Selection tracks",
  id: "selectionTracks",
  meta: { header: "Selection tracks", width: { max: "0.75fr", min: "140px" } },
};

const VIEW: ColumnDef<PangenomeMember> = {
  cell: ViewCell,
  enableSorting: false,
  header: "View",
  id: "view",
  meta: { header: "View", width: "164px" },
};

export const COLUMNS: ColumnDef<PangenomeMember>[] = [
  ASSEMBLY,
  SELECTION_TRACKS,
  LEVEL,
  REF,
  LENGTH,
  VIEW,
];
