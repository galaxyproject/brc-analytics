import { DragEvent } from "react";
import { UseFilePicker } from "../../hooks/UseFilePicker/types";

export interface Props {
  onClick: UseFilePicker["actions"]["onClick"];
  onDrop: (event: DragEvent<HTMLElement>) => void;
}
