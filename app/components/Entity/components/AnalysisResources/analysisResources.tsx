import { Typography, Link } from "@mui/material";
import { Fragment } from "react";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface AnalysisResourcesProps {
  resources: Record<string, Array<{ name: string; url: string }>>;
}

export const AnalysisResources = ({
  resources,
}: AnalysisResourcesProps): JSX.Element => {
  if (Object.keys(resources).length === 0) return <Fragment></Fragment>;
  return (
    <>
      {Object.keys(resources).map((resourceType) => (
        <Fragment key={resourceType}>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
            component="h3"
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
          >
            {resourceType}
          </Typography>
          {resources[resourceType].map((resource) => (
            <Typography
              key={resource.name}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
            >
              <Link href={resource.url}>{resource.name}</Link>
            </Typography>
          ))}
        </Fragment>
      ))}
    </>
  );
};
