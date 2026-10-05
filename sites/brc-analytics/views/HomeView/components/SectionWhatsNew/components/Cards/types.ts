import { type CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export interface Props {
  cards: Pick<CardProps, "cardActions" | "text">[];
}
