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
  const { error, isFavorited, isLoading, toggleFavorite, togglingKey } =
    useFavorites();

  // Login is off on this site -- a permanent state, not a loading one -- so
  // the control cannot be offered and renders nothing.
  if (!isConfigured) return null;

  if (isAuthLoading) return <CircularProgress size={20} />;

  if (!isAuthenticated) {
    return (
      <Tooltip title="Sign in to save">
        <Button
          onClick={login}
          startIcon={<StarBorderIcon />}
          variant="outlined"
        >
          Save
        </Button>
      </Tooltip>
    );
  }

  const favorited = isFavorited(entityType, entityId);
  const button = (
    <Button
      // Only this entity's own toggle disables it -- gating on the shared
      // isToggling flag would freeze every control on the page.
      disabled={isLoading || togglingKey === favoriteKey(entityType, entityId)}
      onClick={() => void toggleFavorite(entityType, entityId)}
      startIcon={favorited ? <StarIcon /> : <StarBorderIcon />}
      variant={favorited ? "contained" : "outlined"}
    >
      {favorited ? "Saved" : "Save"}
    </Button>
  );

  // The toggle stays clickable on failure -- the next click clears the error
  // and retries; the tooltip just reports the last attempt.
  if (error) {
    return (
      <Tooltip title={`Could not update: ${error.message}`}>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
