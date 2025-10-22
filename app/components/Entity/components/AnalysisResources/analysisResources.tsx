import { Typography, Link } from "@mui/material";
import { Fragment } from "react";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface AnalysisResource {
  url: string;
}

export interface AnalysisResourcesProps {
  resources: AnalysisResource[];
}

export const AnalysisResources = ({
  resources,
}: AnalysisResourcesProps): JSX.Element => {
  if (resources.length === 0) return <span>None</span>;

  return (
    <Fragment>
      {resources.map(({ url }) => (
        <Typography key={url} variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {url.split("/").pop()}
          </Link>
        </Typography>
      ))}
    </Fragment>
  );
};
