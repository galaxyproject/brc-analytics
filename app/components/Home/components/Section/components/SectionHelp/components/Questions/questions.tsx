import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { AccordionDetails as MAccordionDetails } from "@mui/material";
import { Accordion } from "../../../../../../../common/Accordion/accordion";
import { AccordionSummary } from "../../../../../../../common/Accordion/components/AccordionSummary/accordionSummary";
import { URLS } from "../../../../../../common/constants";
import { Grid } from "./questions.styles";

export const Questions = (): JSX.Element => {
  return (
    <Grid>
      <Accordion>
        <AccordionSummary>What is the plan?</AccordionSummary>
        <MAccordionDetails>
          We are starting with a small number of pathogen and host genomes to
          flesh out the full functionality of the system. We will then expand to
          all genomes that are available at the VEuPathDb system and beyond.
          Note that we can add any genome to the system as long it is officially
          released. You can submit your own requests for additional datasets at{" "}
          <DXLink
            label="help@brc-analytics.org"
            url="mailto:help@brc-analytics.org"
          />
        </MAccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>How do I do analyses?</AccordionSummary>
        <MAccordionDetails>
          I used to rely on VEuPathDB to perform my analyses. Now that it is no
          longer available, what can I do? Many types of analyses are possible
          via integration with the{" "}
          <DXLink label="Galaxy system" url={URLS.GALAXY_SYSTEM} /> while we
          continue to build this new BRC resource.
        </MAccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>How does BRC Analytics work?</AccordionSummary>
        <MAccordionDetails>
          BRC Analytics will provide access to genomic data and an analytical
          environment. The data will be based on the official releases provided
          by NCBI Datasets and deployed through the UCSC Genome Browser. The
          analytics will be provided by the Galaxy system supported by powerful
          computational infrastructure provided by the Texas Advanced Computing
          Center (<DXLink label="TACC" url={URLS.TACC} />) and{" "}
          <DXLink label="ACCESS-CI" url={URLS.ACCESS_CONSORTIUM} /> consortium.
        </MAccordionDetails>
      </Accordion>
    </Grid>
  );
};
