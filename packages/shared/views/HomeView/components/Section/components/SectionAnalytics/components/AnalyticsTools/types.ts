import { type CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export interface AnalyticsCard extends DXCardProps {
  /**
   * Identifies the card wherever the rotation puts it. A card's own fields
   * cannot: a title is optional and may be an element rather than a string,
   * and two cards can link to the same URL.
   */
  id: string;
}

export interface Props {
  cards: AnalyticsCard[];
}
