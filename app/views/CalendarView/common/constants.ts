import { ROUTES } from "@brc-analytics/core/routes/constants";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";

export const BREADCRUMBS: Breadcrumb[] = [
  {
    path: "/",
    text: "Home",
  },
  {
    path: ROUTES.CALENDAR,
    text: "Calendar",
  },
];
