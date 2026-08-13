import type { PageMeta } from "@repo/shared/meta/types";

export interface Props extends Partial<PageMeta> {
  appTitle: string;
  browserURL: string;
  defaultDescription: string;
}
