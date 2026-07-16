import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ComponentProps } from "react";

export interface Props extends ComponentProps<typeof KeyValuePairs> {
  title: string;
}
