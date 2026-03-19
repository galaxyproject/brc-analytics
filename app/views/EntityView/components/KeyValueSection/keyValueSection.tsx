import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Fragment, JSX } from "react";
import { KeyElType } from "../../ui/KeyElType/keyElType";
import { KeyValueElType } from "../../ui/KeyValueElType/keyValueElType";
import { SectionTitle } from "../../ui/SectionTitle/sectionTitle";
import { ValueElType } from "../../ui/ValueElType/valueElType";
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
