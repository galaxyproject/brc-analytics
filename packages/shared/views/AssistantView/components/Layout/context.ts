import { createContext } from "react";
import type { SelectTab } from "./types";

/**
 * Switches the column shown while the columns are tabbed, for content inside a
 * column, such as a button in the chat that opens the setup. Does nothing
 * outside the layout.
 */
export const SelectTabContext = createContext<SelectTab>(() => undefined);
