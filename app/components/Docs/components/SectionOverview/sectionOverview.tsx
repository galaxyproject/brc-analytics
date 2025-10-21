import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { Divider } from "@mui/material";
import { Fragment } from "react";
import {
  GroupOverview,
  GroupLinks,
  StyledUnorderedList,
} from "./sectionOverview.styles";
import { splitLinks } from "./utils";
import { Props } from "./types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Heading } from "../common/Typography/Heading/heading";

export const SectionOverview = ({ overview }: Props): JSX.Element | null => {
  if (!overview) return null;
  return (
    <Fragment>
      {overview.map(({ label, links }, groupIndex) => {
        return (
          links.length > 0 && (
            <GroupOverview key={groupIndex}>
              {groupIndex > 0 && <Divider />}
              <Heading
                component="h2"
                headingValue={label}
                variant={TYPOGRAPHY_PROPS.VARIANT.HEADING}
              />
              <GroupLinks>
                {splitLinks(links).map(
                  (links, linksIndex) =>
                    links.length > 0 && (
                      <StyledUnorderedList key={linksIndex}>
                        {links.map((linkProps, listIndex) => (
                          <li key={listIndex}>
                            <Link {...linkProps} />
                          </li>
                        ))}
                      </StyledUnorderedList>
                    )
                )}
              </GroupLinks>
            </GroupOverview>
          )
        );
      })}
    </Fragment>
  );
};
