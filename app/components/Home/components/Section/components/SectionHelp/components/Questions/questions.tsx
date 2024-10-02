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
          BRC-Analytics is very new. Out plan is (1) establish access to
          official versions of VEuPathDB’s 785 genomes; (2) develop analytical
          workflows for common analyses such as transcriptomics, variation,
          assembly, and tightly integrate them with the data; (3) ingest and
          provide access to custom annotations that were previously available
          from VEuPathDB. To learn more click “Roadmap” on top.
        </MAccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>Where is the data?</AccordionSummary>
        <MAccordionDetails>
          I used to be able to access many types of data including genomes and
          associated annotations. Where do I find it now? Data for the majority
          of VEuPathDB organisms is available by clicking the “Datasets” link at
          the top.
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
        <AccordionSummary>How does brc-analytics work?</AccordionSummary>
        <MAccordionDetails>
          BRC-Analytics will provide access to genomic data and an analytical
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
