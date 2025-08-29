/**
 * Sanitize an entity ID by replacing all periods with underscores.
 * @param entityId - Entity ID.
 * @returns sanitized entity ID.
 */
export function sanitizeEntityId(entityId?: string): string {
  if (!entityId) return "";
  return entityId.replace(/\./g, "_");
}
