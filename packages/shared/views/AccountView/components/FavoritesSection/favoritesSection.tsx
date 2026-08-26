import { Button, Typography } from "@mui/material";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import {
  favoriteKey,
  useFavorites,
} from "@repo/shared/providers/favorites/provider";
import type { FavoriteEntityType } from "@repo/shared/providers/favorites/types";
import { AccountCard } from "@repo/shared/views/AccountView/components/AccountCard/accountCard";
import { AccountSection } from "@repo/shared/views/AccountView/components/AccountSection/accountSection";
import Link from "next/link";
import { type JSX, useMemo } from "react";
import type { Props } from "./types";
import { ENTITY_TYPE_DISPLAY, getFavoriteLabel } from "./utils";

/**
 * One section of the workspace listing the user's favorites of a single type.
 * @param props - Component props.
 * @param props.entityType - Which favorites to list.
 * @returns the section element.
 */
export function FavoritesSection({ entityType }: Props): JSX.Element {
  // error is read only to suppress the empty-state copy below -- AccountView
  // still owns the single workspace-level alert, so it is not passed on to
  // AccountSection's own error prop (that would render a second alert here).
  const { error, favorites, isLoading, toggleFavorite, togglingKeys } =
    useFavorites();
  const { emptyState, entityRoute, title } = ENTITY_TYPE_DISPLAY[entityType];

  const items = useMemo(
    () => favorites.filter((favorite) => favorite.entity_type === entityType),
    [entityType, favorites]
  );

  return (
    <AccountSection
      count={items.length}
      emptyState={
        // A failed load is not evidence the user has nothing saved -- render
        // nothing here rather than the "nothing saved" copy.
        error ? undefined : (
          <Typography color="text.secondary" variant="body2">
            {emptyState}
          </Typography>
        )
      }
      id={entityRoute}
      isLoading={isLoading}
      title={title}
    >
      {items.length > 0
        ? items.map((favorite) => (
            <AccountCard
              actions={
                <>
                  <Button
                    LinkComponent={Link}
                    href={`/data/${entityRoute}/${sanitizeEntityId(favorite.entity_id)}`}
                    variant="outlined"
                  >
                    Open
                  </Button>
                  <Button
                    disabled={togglingKeys.has(
                      favoriteKey(entityType, favorite.entity_id)
                    )}
                    onClick={() =>
                      void toggleFavorite(entityType, favorite.entity_id)
                    }
                    variant="text"
                  >
                    Remove
                  </Button>
                </>
              }
              key={favorite.entity_id}
              subtitle={`Saved ${new Date(favorite.created_at).toLocaleDateString()}`}
              title={getFavoriteLabel(
                favorite.entity_type as FavoriteEntityType,
                favorite.entity_id
              )}
            />
          ))
        : undefined}
    </AccountSection>
  );
}
