import { STATUS_BADGE_COLOR } from "@databiosphere/findable-ui/lib/components/common/StatusBadge/statusBadge";

/**
 * Returns chip color.
 * @param canPreview - Analysis method can be previewed.
 * @returns Chip color.
 */
export function getChipColor(canPreview: boolean): STATUS_BADGE_COLOR {
  return canPreview ? STATUS_BADGE_COLOR.INFO : STATUS_BADGE_COLOR.DEFAULT;
}

/**
 * Returns chip label.
 * @param canPreview - Analysis method can be previewed.
 * @returns Chip label.
 */
export function getChipLabel(canPreview: boolean): string {
  return canPreview ? "Preview" : "Coming Soon";
}
