import { useState } from "react";
import { Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useLLMDatasetSearch } from "../../../hooks/useLLMDatasetSearch";
import { SearchResults } from "../SearchResults/searchResults";
import {
  SearchContainer,
  SearchForm,
  SearchHelperText,
  SearchFormContainer,
} from "./naturalLanguageSearch.styles";

export const NaturalLanguageSearch = (): JSX.Element => {
  const [query, setQuery] = useState("");
  const { data, search, status } = useLLMDatasetSearch();

  const handleSearch = (): void => {
    search(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !status.loading && query.trim()) {
      handleSearch();
    }
  };

  const hasError = !!status.errors.query || !!status.errors.search;
  const errorMessage = status.errors.query || status.errors.search;

  return (
    <SearchContainer>
      <SearchFormContainer>
        <SearchForm>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the datasets you're looking for..."
            variant="outlined"
            error={hasError}
            helperText={hasError ? errorMessage : ""}
            disabled={status.loading}
            multiline
            rows={2}
            InputProps={{
              endAdornment: status.loading ? (
                <CircularProgress size={20} />
              ) : null,
            }}
            sx={{
              "& .MuiInputBase-multiline": {
                padding: 0,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0, 0, 0, 0.23)",
              },
              "& .MuiOutlinedInput-root": {
                fontSize: "16px",
                lineHeight: "24px",
                padding: "16px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0, 0, 0, 0.87)",
              },
            }}
          />

          <Button
            onClick={handleSearch}
            disabled={status.loading || !query.trim()}
            variant="contained"
            size="large"
            sx={{
              alignSelf: "flex-start",
              height: "56px",
              minWidth: "140px",
            }}
          >
            {status.loading ? "Searching..." : "Search"}
          </Button>
        </SearchForm>

        <SearchHelperText>
          <Typography variant="body2" color="text.secondary">
            Try: &quot;RNA-seq data for malaria parasite from 2023&quot; or
            &quot;Single-cell sequencing of human immune cells&quot;
          </Typography>
        </SearchHelperText>
      </SearchFormContainer>

      {data && <SearchResults response={data} />}
    </SearchContainer>
  );
};
