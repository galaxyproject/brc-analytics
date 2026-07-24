import { OrganismAvatar } from "@/components/Entity/components/OrganismAvatar/organismAvatar";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { buildAssemblyDetails } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { StyledSection } from "@repo/shared/views/EntityView/components/KeyValueSection/keyValueSection.styles";
import { KeyElType } from "@repo/shared/views/EntityView/ui/KeyElType/keyElType";
import { KeyValueElType } from "@repo/shared/views/EntityView/ui/KeyValueElType/keyValueElType";
import { SectionTitle } from "@repo/shared/views/EntityView/ui/SectionTitle/sectionTitle";
import { ValueElType } from "@repo/shared/views/EntityView/ui/ValueElType/valueElType";
import { Fragment, JSX } from "react";
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
