import { AccordionProps, FadeProps, SlideProps } from "@mui/material";

export const ACCORDION_PROPS: Omit<AccordionProps, "children"> = {
  slotProps: { transition: { easing: "ease-in-out", timeout: 500 } },
};

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
