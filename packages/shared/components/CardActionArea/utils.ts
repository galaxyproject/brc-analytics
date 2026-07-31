import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import Link from "next/link";

/**
 * Returns the link component to render for the given link type.
 * @param isInternalLink - Whether the link is internal.
 * @returns next/link for internal links, "a" for external links.
 */
export function getLinkComponent(isInternalLink: boolean): typeof Link | "a" {
  return isInternalLink ? Link : "a";
}

/**
 * Returns the rel attribute for the given link type.
 * @param isInternalLink - Whether the link is internal.
 * @returns The rel attribute.
 */
export function getRelAttribute(isInternalLink: boolean): REL_ATTRIBUTE {
  return isInternalLink
    ? REL_ATTRIBUTE.NO_OPENER
    : REL_ATTRIBUTE.NO_OPENER_NO_REFERRER;
}

/**
 * Returns the target attribute for the given link type.
 * @param isInternalLink - Whether the link is internal.
 * @returns The target attribute.
 */
export function getTargetAttribute(isInternalLink: boolean): ANCHOR_TARGET {
  return isInternalLink ? ANCHOR_TARGET.SELF : ANCHOR_TARGET.BLANK;
}
