import { Button, Typography } from "@mui/material";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
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
  const { error, favorites, isLoading, toggleFavorite, togglingKey } =
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
        <Typography color="text.secondary" variant="body2">
          {emptyState}
        </Typography>
      }
      error={error}
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
                    disabled={
                      togglingKey === `${entityType}:${favorite.entity_id}`
                    }
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
