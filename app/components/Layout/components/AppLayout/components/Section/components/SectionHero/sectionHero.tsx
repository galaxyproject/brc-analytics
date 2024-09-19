import {
  Breadcrumb,
  Breadcrumbs,
} from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ReactNode } from "react";
import {
  Head,
  Headline,
  Section,
  SectionLayout,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";

export interface SectionHeroProps {
  breadcrumbs: Breadcrumb[];
  head: ReactNode;
  subHead: ReactNode;
}

export const SectionHero = ({
  breadcrumbs,
  head,
  subHead,
}: SectionHeroProps): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <Head>{head}</Head>
        </Headline>
        {subHead && (
          <SubHeadline>
            <Subhead>{subHead}</Subhead>
          </SubHeadline>
        )}
      </SectionLayout>
    </Section>
  );
};
