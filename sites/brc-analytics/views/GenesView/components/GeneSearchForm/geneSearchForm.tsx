import { Button, TextField } from "@mui/material";
import { GENE_SEARCH_MAX_LENGTH } from "@repo/shared/services/genes/constants";
import { type FormEvent, type JSX, useState } from "react";
import { StyledForm } from "./geneSearchForm.styles";
import { type GeneSearchFormProps } from "./types";

/**
 * A text box that searches genes when submitted. A new query (as on going
 * Back) resets what it shows; the form stays mounted, so the box or button
 * that submitted keeps focus.
 * @param props - Component props.
 * @param props.onSearch - Called with the text when the form is submitted.
 * @param props.query - The search being shown.
 * @returns The form.
 */
export const GeneSearchForm = ({
  onSearch,
  query,
}: GeneSearchFormProps): JSX.Element => {
  const [value, setValue] = useState(query);
  // The query value was last reset to, so a new one resets it during render
  // rather than after it.
  const [shownQuery, setShownQuery] = useState(query);
  if (query !== shownQuery) {
    setShownQuery(query);
    setValue(query);
  }
  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    onSearch(value.trim());
  };
  return (
    <StyledForm onSubmit={onSubmit} role="search">
      <TextField
        fullWidth
        label="Search genes"
        onChange={(event): void => setValue(event.target.value)}
        placeholder="A gene ID, symbol, accession or product word, e.g. AMA1"
        size="small"
        slotProps={{ htmlInput: { maxLength: GENE_SEARCH_MAX_LENGTH } }}
        type="search"
        value={value}
      />
      <Button type="submit" variant="contained">
        Search
      </Button>
    </StyledForm>
  );
};
