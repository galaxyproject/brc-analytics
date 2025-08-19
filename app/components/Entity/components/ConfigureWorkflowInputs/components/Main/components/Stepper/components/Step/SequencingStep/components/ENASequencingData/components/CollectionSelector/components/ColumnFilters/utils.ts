import { CategoryFilter } from "@databiosphere/findable-ui/lib/components/Filter/components/Filters/filters";
import { CategoryView } from "@databiosphere/findable-ui/lib/common/categories/views/types";

/**
 * Returns all category views from the given category filters.
 * @param categoryFilters - Category filters.
 * @returns Category views.
 */
export function getCategoryViews(
  categoryFilters: CategoryFilter[]
): CategoryView[] {
  return categoryFilters.flatMap(
    (categoryFilter) => categoryFilter.categoryViews
  );
}
