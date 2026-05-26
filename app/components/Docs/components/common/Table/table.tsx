import { Table as MTable } from "@mui/material";
import { JSX } from "react";
import { StyledTableContainer } from "./table.styles";

export const Table = ({ ...props }): JSX.Element => {
  return (
    <StyledTableContainer>
      <MTable>{props.children}</MTable>
    </StyledTableContainer>
  );
};
