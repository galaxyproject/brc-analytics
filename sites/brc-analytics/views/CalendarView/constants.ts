import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "../../../../routes/constants";

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
