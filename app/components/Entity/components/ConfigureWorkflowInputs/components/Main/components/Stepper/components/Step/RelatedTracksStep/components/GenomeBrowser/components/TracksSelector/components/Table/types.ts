import { Row, Table } from "@tanstack/react-table";
import { Track } from "../../hooks/UseTable/types";
import { AccordionProps } from "@mui/material";

export interface Props extends Pick<AccordionProps, "defaultExpanded"> {
  row: Row<Track>;
  table: Table<Track>;
}
