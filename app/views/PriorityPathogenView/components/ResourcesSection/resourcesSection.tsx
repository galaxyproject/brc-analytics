import { Section } from "@/components/Entity/components/Section/section";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { ListItem } from "@mui/material";
import { FluidPaper } from "@repo/shared/components/Paper/components/FluidPaper/fluidPaper";
import { JSX } from "react";
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
