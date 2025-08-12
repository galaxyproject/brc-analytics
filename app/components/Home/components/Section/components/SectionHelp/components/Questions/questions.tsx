import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import {
  AccordionDetails as MAccordionDetails,
  Typography,
} from "@mui/material";
import { Accordion } from "../../../../../../../common/Accordion/accordion";
import { AccordionSummary } from "../../../../../../../common/Accordion/components/AccordionSummary/accordionSummary";
import { URLS } from "../../../../../../common/constants";
import { Grid } from "./questions.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

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
          .
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
      <Accordion>
        <AccordionSummary>Can I really do analyses for free?</AccordionSummary>
        <MAccordionDetails>
          <ol>
            <li>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                How is this possible?
              </Typography>{" "}
              Analytical capabilities of BRC-analytics.org are sustained by
              Galaxy Project. In turn, the Galaxy is deployed on vast
              computational resources provided by the{" "}
              <DXLink label="ACCESS-CI" url={URLS.ACCESS_CONSORTIUM} />{" "}
              consortium and <DXLink label="TACC" url={URLS.TACC} />. Each user
              is provided with 250 Gb of permanent storage and 1Tb of temporary
              scratch storage. A variety of computer systems is available
              depending on what kind of analysis tool is used. These range from
              typical cluster nodes to large memory machines suitable for genome
              assembly or GPU-containing nodes.
            </li>
            <li>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                How long are my datasets stored?
              </Typography>{" "}
              There is no time limit on data stored within the permanent storage
              (250Gb). Scratch storage is limited to 60 days.
            </li>
            <li>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                Who can see my work?
              </Typography>{" "}
              You. To be seen by others you data, workflows, or visualizations
              need to be explicitly shared or made public.
            </li>
            <li>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                Can I upload restricted access data?
              </Typography>{" "}
              BRC-analytics and Galaxy are free, public, internet accessible
              resources. Data transfer and data storage are not encrypted. If
              there are restrictions on the way your research data can be stored
              and used, please consult your local institutional review board or
              the project PI before uploading it to any public site, including
              this Galaxy server.
            </li>
            <li>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                What if I mine BitCoin?
              </Typography>{" "}
              You will banned from using this site forever.
            </li>
          </ol>
        </MAccordionDetails>
      </Accordion>
    </Grid>
  );
};
