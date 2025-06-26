import { SectionTitle } from "@databiosphere/findable-ui/lib/components/common/Section/components/SectionTitle/sectionTitle";
import { Props } from "./types";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Fragment } from "react";
import { KeyValueElType } from "./components/KeyValueElType/keyValueElType";
import { KeyElType } from "./components/KeyElType/keyElType";
import { ValueElType } from "./components/ValueElType/valueElType";

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
