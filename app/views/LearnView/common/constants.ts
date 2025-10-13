import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "../../../../routes/constants";

export const BREADCRUMBS: Breadcrumb[] = [
  { path: "/", text: "Home" },
  { path: ROUTES.LEARN, text: "Learn" },
];

export const DOCUMENTATION_CATEGORIES = [
  {
    id: "getting-started",
    items: [
      {
        icon: "article",
        id: "introduction",
        path: "/learn",
        title: "Introduction",
      },
      {
        icon: "code",
        id: "setup",
        path: "/learn/setup",
        title: "Setup & Installation",
      },
    ],
    title: "Getting Started",
  },
  {
    id: "tutorials",
    items: [
      {
        icon: "tips",
        id: "workflow",
        path: "/learn/tutorials/workflow",
        title: "Running a Workflow",
      },
      {
        icon: "tips",
        id: "data",
        path: "/learn/tutorials/data",
        title: "Working with Data",
      },
    ],
    title: "Tutorials",
  },
  {
    id: "reference",
    items: [
      {
        icon: "code",
        id: "api",
        path: "/learn/reference/api",
        title: "API Documentation",
      },
      { icon: "help", id: "faq", path: "/learn/reference/faq", title: "FAQ" },
    ],
    title: "Reference",
  },
];
