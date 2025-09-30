import { Container, Typography, Box } from "@mui/material";
import { useGalaxyJob } from "../../hooks/useGalaxyJob";
import { GalaxyJobForm } from "./GalaxyJobForm/galaxyJobForm";
import { GalaxyJobHistory } from "./GalaxyJobHistory/galaxyJobHistory";

export const GalaxyJob = (): JSX.Element => {
  const galaxyJobHook = useGalaxyJob();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Logan Search
        </Typography>
        <Typography
          variant="h6"
          color="textSecondary"
          align="center"
          paragraph
          sx={{ mb: 4 }}
        >
          Analyze genomic data using Logan Search powered by Galaxy
        </Typography>
        <GalaxyJobForm galaxyJobHook={galaxyJobHook} />
        <GalaxyJobHistory
          jobHistory={galaxyJobHook.jobHistory}
          onClearHistory={galaxyJobHook.clearJobHistory}
        />
      </Box>
    </Container>
  );
};
