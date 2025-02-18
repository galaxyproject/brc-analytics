import { FadeProps, SlideProps, TabsProps } from "@mui/material";
import { TabScrollFuzz } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs.styles";

export const FADE_PROPS: Omit<FadeProps, "children"> = {
  easing: "ease-in-out",
  exit: false,
  style: { transitionDelay: "500ms" },
  timeout: 500,
};

export const SLIDE_PROPS: Omit<SlideProps, "children"> = {
  direction: "left",
  easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  exit: false,
  timeout: 800,
};

export const TABS_PROPS: TabsProps = {
  ScrollButtonComponent: TabScrollFuzz,
  TabIndicatorProps: { style: { transition: "none" } },
  allowScrollButtonsMobile: true,
};
