import { Section } from "@brc/views/PriorityPathogenView/ui/Section/section";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { ListItem } from "@mui/material";
import { type JSX } from "react";
import { StyledList } from "./resourcesSection.styles";
import type { Props } from "./types";

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
