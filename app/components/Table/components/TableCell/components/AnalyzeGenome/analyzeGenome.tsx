import { JSX } from "react";
import { DropdownButton } from "@databiosphere/findable-ui/lib/components/common/Button/components/DropdownButton/dropdownButton";
import { DropdownMenuButtonProps } from "@databiosphere/findable-ui/lib/components/common/DropdownMenu/common/entities";
import { DropdownMenu } from "@databiosphere/findable-ui/lib/components/common/DropdownMenu/dropdownMenu";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Button, Grid, MenuItem } from "@mui/material";
import NLink from "next/link";
import { BUTTON_PROPS, GRID_PROPS, MENU_PROPS } from "./constants";
import { AnalyzeGenomeProps } from "./types";

export const AnalyzeGenome = ({
  analyze,
  views,
}: AnalyzeGenomeProps): JSX.Element => {
  return (
    <Grid {...GRID_PROPS}>
      <Button
        {...BUTTON_PROPS}
        component={NLink}
        disabled={!analyze.url}
        href={analyze.url}
      >
        {analyze.label}
      </Button>
      <DropdownMenu {...MENU_PROPS} button={renderButton}>
        {({ closeMenu }): JSX.Element[] =>
          views.map((view, i) => (
            <MenuItem
              key={i}
              onClick={(): void => {
                closeMenu();
                window.open(
                  view.url,
                  ANCHOR_TARGET.BLANK,
                  REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
                );
              }}
            >
              {view.label}
            </MenuItem>
          ))
        }
      </DropdownMenu>
    </Grid>
  );
};

/**
 * Render the dropdown button.
 * @param props - Button props e.g. "onClick".
 * @returns button element.
 */
function renderButton(props: DropdownMenuButtonProps): JSX.Element {
  return <DropdownButton {...props}>View</DropdownButton>;
}
