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
            url="https://training.galaxyproject.org/training-material/topics/variant-analysis"
          />
          <AnalysisMethod
            text={<Transcriptomics />}
            title="Transcriptomics"
            url="https://training.galaxyproject.org/training-material/topics/transcriptomics"
          />
          <AnalysisMethod
            text={<Regulation />}
            title="Regulation"
            url="https://training.galaxyproject.org/training-material/topics/epigenetics"
          />
          <AnalysisMethod
            text={<Assembly />}
            title="Assembly"
            url="https://training.galaxyproject.org/training-material/topics/assembly"
          />
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
