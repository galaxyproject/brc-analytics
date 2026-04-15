import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { SearchView } from "../../app/views/SearchView/searchView";

export const Search = (): JSX.Element => {
  return <SearchView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription:
        "Search across organisms, assemblies, and workflows on BRC Analytics.",
      pageTitle: "Search",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Search;

Search.Main = StyledPagesMain;
