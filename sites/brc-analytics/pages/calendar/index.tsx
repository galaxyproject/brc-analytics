import { BRC_PAGE_META } from "@brc/meta/constants";
import { CalendarView } from "@brc/views/CalendarView/calendarView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { PageMeta } from "@repo/shared/meta/types";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <CalendarView />;
};

export const getStaticProps: GetStaticProps<
  PageMeta & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.CALENDAR,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
