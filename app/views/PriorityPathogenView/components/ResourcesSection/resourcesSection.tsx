import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { ListItem } from "@mui/material";
import { JSX } from "react";
import { Section } from "../../../../components/Entity/components/Section/section";
import { FluidPaper } from "../../../../components/common/Paper/components/FluidPaper/fluidPaper";
import { StyledList } from "./resourcesSection.styles";
import { Props } from "./types";

export const ResourcesSection = ({
  resources,
  ...props /* Section Props */
}: Props): JSX.Element => {
  return (
    <Section Paper={FluidPaper} {...props}>
      <StyledList disablePadding>
        {resources.map((resource, i) => (
          <ListItem key={i} disableGutters disablePadding>
            <Link label={resource.title} url={resource.url} />
          </ListItem>
        ))}
      </StyledList>
    </Section>
  );
};
