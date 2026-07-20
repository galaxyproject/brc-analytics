import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { CalendarView } from "@/views/CalendarView/calendarView";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";

const Page = (): JSX.Element => {
  return <CalendarView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      ...BRC_PAGE_META.CALENDAR,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
