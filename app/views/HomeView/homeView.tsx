import { Fragment, useEffect, useState } from "react";
import { SectionAnalytics } from "../../components/Home/components/Section/components/SectionAnalytics/sectionAnalytics";
import { SectionAssemblies } from "../../components/Home/components/Section/components/SectionAssemblies/sectionAssemblies";
import { SectionHelp } from "../../components/Home/components/Section/components/SectionHelp/sectionHelp";
import { SectionHero } from "../../components/Home/components/Section/components/SectionHero/sectionHero";
import { SectionSubHero } from "../../components/Home/components/Section/components/SectionSubHero/sectionSubHero";

// Feature flag name
const SHOW_ASSEMBLIES_SECTION = "show_assemblies_section";

export const HomeView = (): JSX.Element => {
  // State for the feature flag
  const [showAssembliesSection, setShowAssembliesSection] = useState(false);

  // Load the feature flag from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedValue = localStorage.getItem(SHOW_ASSEMBLIES_SECTION);
      if (storedValue !== null) {
        setShowAssembliesSection(storedValue === "true");
      }
    }
  }, []);

  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      {showAssembliesSection && <SectionAssemblies />}
      <SectionAnalytics />
      <SectionHelp />
    </Fragment>
  );
};
