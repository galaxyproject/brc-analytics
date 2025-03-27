"use client"; // Ensure client-side rendering

import React, { useEffect, useState } from "react";
import { Alert, Box, Chip, Stack } from "@mui/material";

import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";

import {
  addAdditionPartToUIQuery,
  combineExpressionParts,
  formatExpression,
  countParenthesis,
  splitOnFirstEqualSign,
  splitUnqouatedSpace,
  validateExpression,
} from "./utils";

import runReadFields from "../../../../../catalog/output/runReadFields.json";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { QueryInputContent, StyledSection } from "./queryBuilder.style";

interface QueryBuilderProps {
  initialQuery: string;
  onQueryChange?: (query: string) => void;
}

/**
 * Renders a dialog component that allows the user to select a field type, which can be a logical operator,
 * a grouper, or a field value. For field values, the user will also be able to set a corresponding value.
 *
 * @param field - The currently selected field type.
 * @param modalOpen - A boolean indicating whether the dialog is open.
 * @param handleClose - A callback function to handle closing the dialog.
 * @param handleSave - A callback function to handle saving the selected field and value.
 * @param setField - A function to update the selected field type.
 * @param setValue - A function to update the value associated with the selected field.
 * @param value - The current value associated with the selected field.
 * @returns A JSX.Element representing the dialog component.
 */
function renderFieldDialog(
  field: string,
  modalOpen: boolean,
  handleClose: () => void,
  handleSave: () => void,
  setField: (field: string) => void,
  setValue: (vaule: string) => void,
  value: string
): JSX.Element {
  return (
    <Dialog open={modalOpen} onClose={handleClose}>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogContent>
        <Select
          fullWidth
          value={field}
          onChange={(e) => setField(e.target.value as string)}
          label="Field"
        >
          {runReadFields.map((field, index) => (
            <MenuItem key={index} value={field.name}>
              {field.name}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogContent hidden={["AND", "OR", "(", ")", ""].includes(field)}>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Item Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Renders a query part as a JSX element based on the provided parameters. The item will be a list of strings and will have length 1 or 2. The two options are:
 * - Length 1: Represents logical operators and grouping 'AND, OR, ), (' or '--ADD--', which is used for rendering the option of adding new elements.
 * - Length 2: Represents a field and value pair.
 *
 * @param {string[]} item - An array representing the query part. The first element determines the field type of the query part (e.g., "tax_id", "(", ")", or other labels).
 * @param {number} index - The index of the query part in the list.
 * @param {number} openParenthesis - The count of open parentheses in the query.
 * @param {number} closeParenthesis - The count of close parentheses in the query.
 * @param {(index: number, field: string, value: string) => void} handleClick - Callback function triggered when the query part is clicked. Receives the index, field, and value as arguments.
 * @param {(index: number) => void} handleDelete - Callback function triggered when the query part is deleted. Receives the index as an argument.
 * @returns {JSX.Element} A JSX element representing the query part, styled and configured based on its type and context.
 */
function renderQueryPart(
  item: string[],
  index: number,
  openParenthesis: number,
  closeParenthesis: number,
  handleClick: (index: number, field: string, value: string) => void,
  handleDelete: (index: number) => void
): JSX.Element {
  let label: string = item[0];
  const variant: string = "outlined";
  let color: string = "primary";

  if (item[0] == "--ADD--") {
    return (
      <AddCircleOutlineIcon
        key={index}
        onClick={() => handleClick(index, "", "")}
        sx={{ cursor: "pointer", fontSize: "0.5rem", position: "relative" }}
      />
    );
  } else if (
    (item[0] === "(" && openParenthesis > closeParenthesis) ||
    (item[0] === ")" && openParenthesis < closeParenthesis)
  ) {
    return (
      <Chip
        key={index}
        label={label}
        color={color as "default" | "success"}
        variant={variant as "outlined" | "filled"}
        deleteIcon={
          <span
            style={{
              color: "black",
              fontSize: "0.5rem",
              fontWeight: "bold",
              lineHeight: "1",
            }}
          >
            ×
          </span>
        }
        sx={{
          "& .MuiChip-deleteIcon": {
            marginRight: "-4px",
            marginTop: "-16px",
          },
          "@keyframes blinking": {
            "0%": { backgroundColor: "red" },
            "100%": { backgroundColor: "red" },
            "50%": { backgroundColor: "transparent" },
          },
          animation: "blinking 1s infinite",
        }}
        onClick={() => handleClick(index, item[0], item[1])}
        onDelete={() => handleDelete(index)}
      />
    );
  } else {
    if (label !== "AND" && label !== "OR") {
      if (item[0] !== "(" && item[0] !== ")") {
        label = `${item[0]} : ${item[1]} `;
      }
    } else {
      color = "success";
    }
  }

  return (
    <Chip
      key={index}
      label={label}
      color={color as "default" | "success"}
      variant={variant as "outlined" | "filled"}
      onDelete={() => handleDelete(index)}
      onClick={() => handleClick(index, item[0], item[1])}
      deleteIcon={
        <span
          style={{
            color: "red",
            fontSize: "0.5rem",
            fontWeight: "bold",
            lineHeight: "1",
          }}
        >
          ×
        </span>
      }
      sx={{
        "& .MuiChip-deleteIcon": {
          marginRight: "5px",
          marginTop: "-8px",
        },
      }}
    />
  );
}

/**
 * Renders a query string input field for entering filter criteria.
 *
 * @param filterString - The current filter string value to display in the input field.
 * @param validateQueryExpressionAndUpdateFilterString - A callback function that validates the query expression
 * and updates the filter string. It takes the input expression as a parameter and returns a boolean indicating
 * whether the validation was successful.
 * @returns A JSX element representing the query string input field.
 */
function renderQueryStringInput(
  filterString: string,
  validateQueryExpressionAndUpdateFilterString: (expression: string) => boolean
): JSX.Element {
  return (
    <QueryInputContent
      type="text"
      placeholder="Enter filter criteria"
      value={filterString}
      onChange={(e) =>
        validateQueryExpressionAndUpdateFilterString(
          formatExpression(e.target.value)
        )
      }
    />
  );
}

/**
 * Renders a query builder component that allows users to construct and modify a filter string
 * using a visual interface. The component supports nested expressions, parentheses, and logical operators.
 *
 * @param filterString - The initial filter string to be parsed and displayed in the query builder.
 * @param validateQueryExpressionAndUpdateFilterString - A callback function that validates the query expression
 * and updates the filter string. It should return `true` if the expression is valid, otherwise `false`.
 *
 * @returns A JSX element representing the query builder interface.
 *
 * ## State Variables:
 * - `field`: Represents the current selected field or logical operator being edited.
 * - `index`: Tracks the index of the currently selected query part.
 * - `modalOpen`: Controls the visibility of the modal dialog for editing query parts.
 * - `value`: Stores the value of the currently selected query part.
 * - `clientRendered`: Ensures the component is only rendered on the client side.
 *
 * ## Functions:
 * - `handleClose`: Resets the modal state and clears the selected query part.
 * - `handleDelete`: Removes a query part at the specified index and updates the filter string.
 * - `handleOpen`: Opens the modal dialog for editing a query part, initializing its state.
 * - `handleSave`: Saves the changes made to a query part and updates the filter string.
 * - `renderElements`: Recursively renders query parts, handling nested parentheses and groups.
 *
 * ## Rendering:
 * - The query builder is displayed as a stack of query parts, with support for nested groups.
 * - A modal dialog is used for editing individual query parts.
 *
 * ## Dependencies:
 * - `splitUnqouatedSpace`: Splits the filter string into parts based on unquoted spaces.
 * - `splitOnFirstEqualSign`: Splits a query part into a field and value based on the first `=` sign.
 * - `addAdditionPartToUIQuery`: Adds additional UI-specific parts to the query.
 * - `combineExpressionParts`: Combines query parts back into a filter string.
 * - `countParenthesis`: Counts the number of open and close parentheses in the filter string.
 * - `renderQueryPart`: Renders an individual query part as a JSX element.
 * - `renderFieldDialog`: Renders the modal dialog for editing query parts.
 */
function RenderQueryBuilder(
  filterString: string,
  validateQueryExpressionAndUpdateFilterString: (expression: string) => boolean
): JSX.Element {
  const [field, setField] = useState("");
  const [index, setIndex] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("");

  const filterStringParts = addAdditionPartToUIQuery(
    splitUnqouatedSpace(filterString).map((item) => splitOnFirstEqualSign(item))
  );

  const handleClose = (): void => {
    setModalOpen(false);
    setIndex(-1);
    setField("");
    setValue("");
  };

  const handleDelete = (index: number): void => {
    const newTokenParts = [...filterStringParts];
    newTokenParts.splice(index, 1);
    validateQueryExpressionAndUpdateFilterString(
      combineExpressionParts(
        newTokenParts.filter((item) => item[0] !== "--ADD--")
      )
    );
  };

  const handleOpen = (index: number, field: string, value: string): void => {
    setModalOpen(true);
    setField(field === "" ? "AND" : field);
    setIndex(index);
    setValue(value);
  };

  const handleSave = (): void => {
    filterStringParts[index][0] = field;
    if (!["(", ")", "AND", "OR"].includes(field)) {
      filterStringParts[index][1] = value;
    } else {
      filterStringParts[index].splice(1, 1);
    }
    validateQueryExpressionAndUpdateFilterString(
      combineExpressionParts(
        filterStringParts.filter((item: string[]) => item[0] !== "--ADD--")
      )
    );

    handleClose();
  };

  const [openParenthesis, closeParenthesis] = countParenthesis(filterString);

  function renderElements(
    parts: string[][],
    startIndex: number
  ): [JSX.Element[], number] {
    const elements: JSX.Element[] = [];
    let index: number = startIndex;

    while (index < parts.length) {
      if (parts[index][0] === "(") {
        const [nestedElements, endIndex] = renderElements(parts, index + 1);
        elements.push(
          <Box
            sx={{
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              padding: 1,
            }}
          >
            {renderQueryPart(
              parts[index],
              index,
              openParenthesis,
              closeParenthesis,
              handleOpen,
              handleDelete
            )}
            {nestedElements}
          </Box>
        );
        index = endIndex; // Skip to the end of the group
      } else if (parts[index][0] === ")") {
        elements.push(
          renderQueryPart(
            parts[index],
            index,
            openParenthesis,
            closeParenthesis,
            handleOpen,
            handleDelete
          )
        );
        return [elements, index]; // End of the current group
      } else {
        elements.push(
          renderQueryPart(
            parts[index],
            index,
            openParenthesis,
            closeParenthesis,
            handleOpen,
            handleDelete
          )
        );
      }
      index++;
    }
    return [elements, index];
  }

  const [clientRendered, setClientRendered] = useState(false);

  useEffect(() => {
    setClientRendered(true);
  }, []);

  return (
    <>
      {clientRendered && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 2,
          }}
        >
          {renderElements(filterStringParts, 0)[0]}
        </Stack>
      )}
      {renderFieldDialog(
        field,
        modalOpen,
        handleClose,
        handleSave,
        setField,
        setValue,
        value
      )}
    </>
  );
}

/**
 * QueryBuilder component allows users to construct and validate query expressions
 * using either a UI-based editor, a text-based editor, or a combination of both.
 *
 * @param {QueryBuilderProps} props - The properties for the QueryBuilder component.
 * @param {string} props.initialQuery - The initial query expression to populate the builder, ex 'tax_id=5134'.
 * @param {(expression: string) => void} props.onQueryChange - Callback function triggered when the query changes providing a valied filterstring.
 *
 * @returns {JSX.Element} The rendered QueryBuilder component.
 *
 * @remarks
 * - The component maintains internal state for the query string (`filterString`), syntax errors (`searchSyntaxError`),
 *   and the currently selected editor mode (`editorToShow`).
 * - The `validateQueryExpressionAndUpdateFilterString` function validates the query expression and updates the state.
 * - Users can toggle between different editor modes (UI, Text, or both) using a dropdown menu.
 * - Syntax errors, if any, are displayed as a list of alerts.
 *
 * @example
 * ```tsx
 * <QueryBuilder
 *   initialQuery="tax_id=5134 AND library_strategy=PAIRED"
 *   onQueryChange={(query) => console.log("Updated query:", query)}
 * />
 * ```
 */
export const QueryBuilder = ({
  initialQuery,
  onQueryChange,
}: QueryBuilderProps): JSX.Element => {
  const [filterString, setFilterString] = useState<string>(
    initialQuery ? formatExpression(initialQuery) : ""
  );
  const [searchSyntaxError, setSearchSyntaxError] = useState<string[]>([]);
  const [editorToShow, setEditorToShow] = useState<string>("UI");

  const validateQueryExpressionAndUpdateFilterString = (
    expression: string
  ): boolean => {
    const expressionValidated = validateExpression(expression);
    const valid = expressionValidated.length === 0;
    if (!valid) {
      setSearchSyntaxError(expressionValidated);
    } else {
      setSearchSyntaxError([]);
    }
    setFilterString(expression);
    if (valid && onQueryChange) {
      onQueryChange(expression);
    }
    return valid;
  };

  return (
    <FluidPaper>
      <GridPaper>
        <StyledSection>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            Query builder:
            <select
              style={{
                backgroundColor: "white",
                border: "none",
                borderRadius: "0",
                boxShadow: "none",
                float: "right",
                textAlign: "right",
              }}
              onChange={(e) => setEditorToShow(e.target.value)}
              value={editorToShow}
            >
              <option value="UI">UI</option>
              <option value="TEXT">Text</option>
              <option value="UI/TEXT">UI/Text</option>
            </select>
          </p>
          <div hidden={editorToShow !== "TEXT" && editorToShow !== "UI/TEXT"}>
            {renderQueryStringInput(
              filterString,
              validateQueryExpressionAndUpdateFilterString
            )}
          </div>
          <div hidden={editorToShow !== "UI" && editorToShow !== "UI/TEXT"}>
            {RenderQueryBuilder(
              filterString,
              validateQueryExpressionAndUpdateFilterString
            )}
          </div>
          {searchSyntaxError.length > 0 && (
            <div>
              <Stack sx={{ width: "100%" }} spacing={2}>
                {searchSyntaxError.map((error, index) => (
                  <Alert severity="error" key={index}>
                    {error}
                  </Alert>
                ))}
              </Stack>
            </div>
          )}
        </StyledSection>
      </GridPaper>
    </FluidPaper>
  );
};
