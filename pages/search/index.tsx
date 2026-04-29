import { GetStaticProps } from "next";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { SearchView } from "../../app/views/SearchView/searchView";

export const Search = (): JSX.Element => {
  return <SearchView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      ...BRC_PAGE_META.SEARCH,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Search;

Search.Main = StyledPagesMain;
