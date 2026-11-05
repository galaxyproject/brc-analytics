import { Button, TextField } from "@mui/material";
import { GENE_SEARCH_MAX_LENGTH } from "@repo/shared/services/genes/constants";
import { type FormEvent, type JSX, useState } from "react";
import { StyledForm } from "./geneSearchForm.styles";
import { type GeneSearchFormProps } from "./types";

/**
 * A text box that searches genes when submitted. Keyed by its query where it
 * is used, so a new query (as on going back) resets what it shows.
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
