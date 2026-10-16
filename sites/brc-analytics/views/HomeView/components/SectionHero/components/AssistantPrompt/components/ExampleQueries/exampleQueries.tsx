import {
  type DropdownMenuButtonKey,
  type DropdownMenuButtonProps,
} from "@databiosphere/findable-ui/lib/components/common/DropdownMenu/common/entities";
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

/**
 * Example questions under the hero prompt. The menus render in a portal, outside the
 * prompt form, so each question is a submit button tied to the form by `form={formId}`;
 * the form reads the question from the submitter's `data-query`.
 * @param props - Component props.
 * @param props.formId - Id of the prompt form the questions submit.
 * @returns The example question chips and their menus.
 */
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
  {
    open: _open,
    ...props
  }: Pick<DropdownMenuButtonProps, DropdownMenuButtonKey>,
  label: string
): JSX.Element {
  return (
    <StyledChip
      {...props}
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
      variant={CHIP_PROPS.VARIANT.OUTLINED}
    />
  );
}
