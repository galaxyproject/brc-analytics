import { KeyElType } from "@/views/EntityView/ui/KeyElType/keyElType";
import { KeyValueElType } from "@/views/EntityView/ui/KeyValueElType/keyValueElType";
import { SectionTitle } from "@/views/EntityView/ui/SectionTitle/sectionTitle";
import { ValueElType } from "@/views/EntityView/ui/ValueElType/valueElType";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Fragment, JSX } from "react";
import { StyledSection } from "./keyValueSection.styles";
import { Props } from "./types";

/**
 * Renders a key-value section.
 * @param props - Props.
 * @param props.title - Title.
 * @returns Key-value section.
 */
export const KeyValueSection = ({ title, ...props }: Props): JSX.Element => {
  return (
    <StyledSection>
      <SectionTitle>{title}</SectionTitle>
      <KeyValuePairs
        KeyElType={KeyElType}
        KeyValueElType={KeyValueElType}
        KeyValuesElType={Fragment}
        ValueElType={ValueElType}
        {...props}
      />
    </StyledSection>
  );
};
