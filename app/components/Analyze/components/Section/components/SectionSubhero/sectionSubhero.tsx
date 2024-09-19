import { TEXT_BODY_LARGE_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Typography } from "@mui/material";
import { Video } from "../../../../../common/Video/video";
import { SubHeroContent } from "../../../../content";
import { Section } from "../../section.styles";
import {
  SectionLayout,
  Subhead,
  SubHeadline,
  VideoContainer,
} from "./sectionSubhero.styles";

export const SectionSubhero = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <VideoContainer>
          <Video url="https://youtu.be/k6fTVIR4GME" />
        </VideoContainer>
        <SubHeadline>
          <Subhead>How to run the workflows</Subhead>
          <Typography color="ink.light" variant={TEXT_BODY_LARGE_400_2_LINES}>
            <SubHeroContent />
          </Typography>
        </SubHeadline>
      </SectionLayout>
    </Section>
  );
};
