import { type DropdownMenuButtonProps } from "@databiosphere/findable-ui/lib/components/common/DropdownMenu/common/entities";
import { DropdownMenu } from "@databiosphere/findable-ui/lib/components/common/DropdownMenu/dropdownMenu";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import { type JSX } from "react";
import { EXAMPLE_CATEGORIES, MENU_PROPS } from "./constants";
import {
  StyledChip,
  StyledExampleQueries,
  StyledMenuItem,
} from "./exampleQueries.styles";
import type { Props } from "./types";

export const ExampleQueries = ({ formId }: Props): JSX.Element => {
  return (
    <StyledExampleQueries>
      {EXAMPLE_CATEGORIES.map(({ label, queries }) => (
        <DropdownMenu
          {...MENU_PROPS}
          button={(props): JSX.Element => renderButton(props, label)}
          key={label}
        >
          {({ closeMenu }): JSX.Element[] =>
            queries.map((query) => (
              <StyledMenuItem
                component="button"
                data-query={query}
                form={formId}
                key={query}
                onClick={closeMenu}
                type="submit"
              >
                {query}
              </StyledMenuItem>
            ))
          }
        </DropdownMenu>
      ))}
    </StyledExampleQueries>
  );
};

function renderButton(
  { onClick, open }: DropdownMenuButtonProps,
  label: string
): JSX.Element {
  return (
    <StyledChip
      aria-expanded={open}
      aria-haspopup="menu"
      color={CHIP_PROPS.COLOR.SECONDARY}
      component="button"
      label={
        <>
          {label}
          <ArrowDropDownRoundedIcon
            color={SVG_ICON_PROPS.COLOR.INK_LIGHT}
            fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
          />
        </>
      }
      onClick={onClick}
      variant={CHIP_PROPS.VARIANT.OUTLINED}
    />
  );
}
