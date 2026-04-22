import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { SectionTitle } from "@databiosphere/findable-ui/lib/components/common/Section/components/SectionTitle/sectionTitle";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { Fragment, JSX } from "react";
import { KeyElType } from "./components/KeyElType/keyElType";
import { KeyValueElType } from "./components/KeyValueElType/keyValueElType";
import { ValueElType } from "./components/ValueElType/valueElType";
import { Props } from "./types";

export const KeyValueSection = ({
  title,
  ...props /* KeyValuePairs Props */
}: Props): JSX.Element => {
  return (
    <GridPaperSection>
      {title && <SectionTitle title={title} />}
      <KeyValuePairs
        KeyElType={KeyElType}
        KeyValueElType={KeyValueElType}
        KeyValuesElType={Fragment}
        ValueElType={ValueElType}
        {...props}
      />
    </GridPaperSection>
  );
};
