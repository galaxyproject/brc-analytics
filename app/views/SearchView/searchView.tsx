import { Fragment, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import {
  NaturalLanguageSearch,
  WorkflowSuggestion,
} from "../../components/LLMSearch";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";
import { SearchSection } from "./searchView.styles";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Component for managing tab panel content visibility
 * @param props - The tab panel props
 * @param props.children - The content to display
 * @param props.index - The tab index
 * @param props.value - The active tab value
 * @returns Tab panel component
 */
const TabPanel = (props: TabPanelProps): JSX.Element => {
  const { children, index, value } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const SearchView = (): JSX.Element => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ): void => {
    setTabValue(newValue);
  };

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="AI-Powered Search"
        subHead="Find datasets and discover workflows using natural language"
      />
      <SearchSection>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="search tabs"
          >
            <Tab label="Dataset Search" id="search-tab-0" />
            <Tab label="Workflow Suggestion" id="search-tab-1" />
          </Tabs>
        </Box>
        <TabPanel index={0} value={tabValue}>
          <NaturalLanguageSearch />
        </TabPanel>
        <TabPanel index={1} value={tabValue}>
          <WorkflowSuggestion />
        </TabPanel>
      </SearchSection>
    </Fragment>
  );
};
