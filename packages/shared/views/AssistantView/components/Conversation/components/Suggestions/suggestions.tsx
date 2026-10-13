import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { List, ListItem, ListItemButton, Typography } from "@mui/material";
import { type JSX, useId } from "react";
import { HEADING, TYPE_SOMETHING_ELSE } from "./constants";
import { StyledRoundedPaper, StyledStack } from "./suggestions.styles";
import type { SuggestionsProps } from "./types";
import { buildSuggestionItems } from "./utils";

/**
 * Renders the suggested next steps as a list of rows, each with a title and,
 * when the assistant gives one, a description. Selecting a row sends it as the
 * user's message. A last row, "Type something else...", moves focus to the
 * composer. Every row is disabled while the assistant is busy. Renders nothing
 * when there are no suggestions.
 * @param props - Component props.
 * @param props.disabled - Whether the assistant is busy, so nothing can be sent.
 * @param props.onFocusComposer - Moves focus to the composer.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.suggestions - Suggested next steps.
 * @returns The suggestions element, or null when there are none.
 */
export const Suggestions = ({
  disabled,
  onFocusComposer,
  onSend,
  suggestions,
}: SuggestionsProps): JSX.Element | null => {
  const headingId = useId();
  const items = buildSuggestionItems(suggestions, onSend, onFocusComposer);
  if (items.length === 0) return null;
  return (
    <StyledStack>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
        component="h2"
        id={headingId}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}
      >
        {HEADING}
      </Typography>
      <StyledRoundedPaper elevation={0}>
        <List aria-labelledby={headingId} disablePadding>
          {items.map(({ description, key, label, onSelect }) => (
            <ListItem disablePadding key={key}>
              <ListItemButton disabled={disabled} onClick={onSelect}>
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
                >
                  {label}
                </Typography>
                {description && (
                  <Typography
                    color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                    variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
                  >
                    {description}
                  </Typography>
                )}
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton disabled={disabled} onClick={onFocusComposer}>
              <Typography
                color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
              >
                {TYPE_SOMETHING_ELSE}
              </Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </StyledRoundedPaper>
    </StyledStack>
  );
};
