import { BRC_ROUTES } from "@/routes/constants";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";

export const BREADCRUMBS: Breadcrumb[] = [
  {
    path: "/",
    text: "Home",
  },
  {
    path: BRC_ROUTES.CALENDAR,
    text: "Calendar",
  },
];
