import { TEXT_BODY_LARGE_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Typography } from "@mui/material";
import { Video } from "../../../../../common/Video/video";
import {
  Assembly,
  GenomeComparisons,
  ProteinFolding,
  Regulation,
  SubHeadText,
  Transcriptomics,
  VariantCalling,
} from "../../../../content";
import { Section } from "../../section.styles";
import { AnalysisMethod } from "./components/AnalysisMethod/analysisMethod";
import {
  SectionContent,
  SectionLayout,
  Subhead,
  SubHeadline,
  VideoContainer,
} from "./sectionAnalysisMethod.styles";

export const SectionAnalysisMethod = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <VideoContainer>
          <Video url="https://youtu.be/k6fTVIR4GME" />
        </VideoContainer>
        <SubHeadline>
          <Subhead>How to run the workflows</Subhead>
          <Typography color="ink.light" variant={TEXT_BODY_LARGE_400_2_LINES}>
            <SubHeadText />
          </Typography>
        </SubHeadline>
        <SectionContent>
          <AnalysisMethod
            text={<VariantCalling />}
            title="Variant calling"
            url=""
          />
          <AnalysisMethod
            text={<Transcriptomics />}
            title="Transcriptomics"
            url=""
          />
          <AnalysisMethod text={<Regulation />} title="Regulation" url="" />
          <AnalysisMethod text={<Assembly />} title="Assembly" url="" />
          <AnalysisMethod
            text={<GenomeComparisons />}
            title="Genome comparisons"
            url=""
          />
          <AnalysisMethod
            text={<ProteinFolding />}
            title="Protein folding"
            url=""
          />
        </SectionContent>
      </SectionLayout>
    </Section>
  );
};
