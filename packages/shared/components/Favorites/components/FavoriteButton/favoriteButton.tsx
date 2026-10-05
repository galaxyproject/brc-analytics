import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import {
  favoriteKey,
  useFavorites,
} from "@repo/shared/providers/favorites/provider";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Save control for an entity's detail page, rendered in the page hero.
 * @param props - Component props.
 * @param props.entityId - Entity id to favorite.
 * @param props.entityType - Which kind of entity this is.
 * @returns the save button, or null where login is not configured.
 */
export function FavoriteButton({
  entityId,
  entityType,
}: Props): JSX.Element | null {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const {
    error,
    hasLoaded,
    isFavorited,
    isLoading,
    toggleFavorite,
    togglingKeys,
  } = useFavorites();

  // Login is off on this site -- a permanent state, not a loading one -- so
  // the control cannot be offered and renders nothing.
  if (!isConfigured) return null;

  if (isAuthLoading) return <CircularProgress size={20} />;

  if (!isAuthenticated) {
    // Says it on the face of the button rather than in a tooltip: a tooltip is
    // invisible to screen readers and to anyone on a touch device, both of whom
    // would otherwise read this as a save control that silently signs them in.
    return (
      <Button onClick={login} startIcon={<StarBorderIcon />} variant="outlined">
        Sign in to save
      </Button>
    );
  }

  const favorited = isFavorited(entityType, entityId);
  const button = (
    <Button
      // Only this entity's own toggle disables it -- gating on the shared
      // isToggling flag would freeze every control on the page.
      // !hasLoaded is the load-failed case: the set is unknown, so the
      // button cannot say whether this entity is saved, let alone toggle it.
      disabled={
        isLoading ||
        !hasLoaded ||
        togglingKeys.has(favoriteKey(entityType, entityId))
      }
      onClick={() => void toggleFavorite(entityType, entityId)}
      startIcon={favorited ? <StarIcon /> : <StarBorderIcon />}
      variant={favorited ? "contained" : "outlined"}
    >
      {favorited ? "Saved" : "Save"}
    </Button>
  );

  // A failed toggle stays clickable -- the next click clears the error and
  // retries. A failed load does not: the button above is disabled, and saying
  // "could not update" would misreport what went wrong.
  if (error) {
    return (
      <Tooltip
        title={
          hasLoaded
            ? `Could not update: ${error.message}`
            : `Could not load your saved items: ${error.message}`
        }
      >
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
