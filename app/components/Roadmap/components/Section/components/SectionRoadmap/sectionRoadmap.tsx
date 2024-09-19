import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { Section } from "../../section.styles";
import {
  Category,
  CategorySubTitle,
  CategoryText,
  CategoryTitle,
  SectionContent,
  SectionLayout,
  Subhead,
  SubHeadline,
} from "./sectionRoadmap.styles";

export const SectionRoadmap = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <SubHeadline>
          <Subhead>Development Plan</Subhead>
        </SubHeadline>
        <SectionContent>
          <Category>
            <CategoryTitle>Develop data component</CategoryTitle>
            <CategorySubTitle>Data harmonization and ingest</CategorySubTitle>
            <CategoryText>
              The list of all 785 genomes originally found in VEuPathDB will be
              harmonized. This means that for each genome, we will identify the
              latest official release listed at NCBI. The data will then be
              ingested by the UCSC Genome Browser team to create a browser
              instance for each genome. The instance will initially contain
              annotations provided by the NCBI. Next, the best effort will be
              made to transfer any additional annotations (not found at NCBI)
              from VuePathDb database to each of the browsers. In particular, we
              will work on maximizing the amount of information available on
              gene pages.
            </CategoryText>
            <CategorySubTitle>Search component implementation</CategorySubTitle>
            <CategoryText>
              A search component allowing users to perform custom queries on all
              data will be developed. It will allow functionality that was
              previously provided by VEuPathDB’s “search strategy” component.{" "}
            </CategoryText>
          </Category>
          <Category>
            <CategoryTitle>Develop analysis component</CategoryTitle>
            <CategorySubTitle>
              Develop best practices for common analyses
            </CategorySubTitle>
            <CategoryText>
              Develop and deploy robust analysis workflows for (1)
              transcriptomics (bulk and single cell), (2) variant analysis, (3)
              genome assembly, (4) genome annotation, (5) regulation (ChIP-seq
              and related) and others as appropriate. This will be done in close
              collaboration with the research community, which will guide us
              based on current needs and research trends.
            </CategoryText>
            <CategorySubTitle>
              Ensure tight integration between data and analysis components
            </CategorySubTitle>
            <CategoryText>
              To increase usability of brc-analytics a substantial amount of
              engineering will be devoted to making the interplay between data
              and analytics components as seamless as possible. For example,
              selecting a genome during the search phase will automatically
              pre-fill the analysis step with necessary reference data for this
              species such as read-mapper indices, SNPeff databases, and other
              artifacts.
            </CategoryText>
          </Category>
          <Category>
            <CategoryTitle>Develop training component</CategoryTitle>
            <CategoryText>
              Training and outreach activities are absolutely essential to our
              efforts. To reflect this degree of importance, we will provide
              tutorials, workshops & training materials, and the infrastructure
              necessary for enabling worldwide training events. Our training
              will include step-by-step interactive tutorials accessible
              directly from the Galaxy interface to facilitate learning our
              available features, a service for reserving and monitoring
              computational resources necessary for running live and on-line
              workshops anywhere in the world. A globally distributed yearly
              event (known and Smörgasbord) is dedicated to community-suggested
              topics and regularly attracts thousands of on-line participants.
              To achieve these goals we will be leveraging the highly successful
              Galaxy Training Network (
              <Link label="GTN" url="https://training.galaxyproject.org" />
              ).
            </CategoryText>
          </Category>
        </SectionContent>
      </SectionLayout>
    </Section>
  );
};
