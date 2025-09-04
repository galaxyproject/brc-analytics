import { Fragment } from "react";
import { Typography, Container } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <Container>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XLARGE}>
          Genome Ark 2
        </Typography>
      </Container>
    </Fragment>
  );
};
