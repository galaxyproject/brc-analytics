import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { IconButton, Tooltip } from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import {
  favoriteKey,
  useFavorites,
} from "@repo/shared/providers/favorites/provider";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Star control for one row of a list table.
 *
 * State comes from FavoritesProvider, so rendering this in every row of the
 * assemblies (~5,500) or organisms (~2,000) table still costs one request.
 * @param props - Component props.
 * @param props.entityId - Entity id for this row.
 * @param props.entityType - Which kind of entity this table lists.
 * @returns the star control, or null where login is not configured.
 */
export function FavoriteCell({
  entityId,
  entityType,
}: Props): JSX.Element | null {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const { isFavorited, isLoading, toggleFavorite, togglingKeys } =
    useFavorites();

  // Login is off on this site -- a permanent state, not a loading one.
  if (!isConfigured || isAuthLoading) return null;

  const favorited = isAuthenticated && isFavorited(entityType, entityId);
  // Signed out, this control signs you in -- so the accessible name has to say
  // that. The tooltip already did, but aria-label overrides it for assistive
  // tech, which left screen reader users hearing "Save" for a sign-in button.
  const savedLabel = favorited
    ? `Remove ${entityId} from saved`
    : `Save ${entityId}`;
  const label = isAuthenticated ? savedLabel : `Sign in to save ${entityId}`;

  function handleClick(): void {
    if (!isAuthenticated) {
      login();
      return;
    }
    void toggleFavorite(entityType, entityId);
  }

  return (
    <Tooltip title={isAuthenticated ? label : "Sign in to save"}>
      <IconButton
        aria-label={label}
        // isLoading covers the window before the initial GET /favorites
        // resolves, when isFavorited reads an empty set -- a click there
        // would fire a create for an entity that may already be saved.
        // Only the rows in flight are disabled -- gating on the shared
        // isToggling flag would freeze every star in the table.
        // Both gates are about favorites we might not have loaded yet, which
        // is meaningless signed out: the click just opens login. The provider
        // never reports loading to a signed-out user today, so this only stops
        // the cell from depending on that staying true.
        disabled={
          isAuthenticated &&
          (isLoading || togglingKeys.has(favoriteKey(entityType, entityId)))
        }
        onClick={handleClick}
        size="small"
      >
        {favorited ? (
          <StarIcon color="primary" fontSize="small" />
        ) : (
          <StarBorderIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
