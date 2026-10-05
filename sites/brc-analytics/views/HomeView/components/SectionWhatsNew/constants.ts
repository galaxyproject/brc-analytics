import * as MDX from "@brc/views/HomeView/components/SectionWhatsNew/content";
import { type CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export const WHATS_NEW_CARDS: Pick<CardProps, "cardActions" | "text">[] = [
  {
    cardActions: [
      {
        label: "Try PrimAeon",
        url: "https://primaeon.org",
      },
      {
        label: "Learn more",
        url: "/learn/primaeon",
      },
    ],
    text: MDX.PrimAeon({}),
  },
  {
    cardActions: [
      { label: "Take the survey", url: "https://forms.gle/Nc95PMgULhUwZ3Kp8" },
    ],
    text: MDX.UserSurvey({}),
  },
  {
    cardActions: [
      {
        label: "View Analysis",
        url: "/learn/featured-analyses/evolutionary-dynamics-of-coding-overlaps-in-measles",
      },
    ],
    text: MDX.EvolutionaryDynamicsOfCodingOverlapsInMeaslesVirus({}),
  },
  {
    cardActions: [{ label: "View Roadmap", url: "/roadmap" }],
    text: MDX.Roadmap({}),
  },
  {
    cardActions: [
      {
        label: "Register here!",
        url: "https://forms.office.com/pages/responsepage.aspx?id=8WfZJNg-SES6plYOxXKss8gM98-9jH9MgRdwq7CpaB5URVVKRFpaV0tCOUQxSFRQUzlGVEhFVjJHUi4u&route=shorturl",
      },
    ],
    text: MDX.WebinarSeries({}),
  },
];
