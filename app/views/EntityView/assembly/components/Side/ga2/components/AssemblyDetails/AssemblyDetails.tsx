import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Fragment, JSX } from "react";
import { OrganismAvatar } from "../../../../../../../../components/Entity/components/OrganismAvatar/organismAvatar";
import { buildAssemblyDetails } from "../../../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { StyledSection } from "../../../../../../components/KeyValueSection/keyValueSection.styles";
import { KeyElType } from "../../../../../../ui/KeyElType/keyElType";
import { KeyValueElType } from "../../../../../../ui/KeyValueElType/keyValueElType";
import { SectionTitle } from "../../../../../../ui/SectionTitle/sectionTitle";
import { ValueElType } from "../../../../../../ui/ValueElType/valueElType";
import { Props } from "./types";

/**
 * GA2-specific "Assembly Details" component for the side column of an entity view.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns JSX element representing the assembly details section for GA2 assemblies.
 */
export const AssemblyDetails = ({ assembly }: Props): JSX.Element => {
  return (
    <StyledSection>
      <SectionTitle>Assembly Details</SectionTitle>
      <OrganismAvatar image={assembly.image} isThumbnail={false} />
      <KeyValuePairs
        KeyElType={KeyElType}
        KeyValueElType={KeyValueElType}
        KeyValuesElType={Fragment}
        ValueElType={ValueElType}
        {...buildAssemblyDetails(assembly)}
      />
    </StyledSection>
  );
};
