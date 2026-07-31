import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { config } from "@/config/config";
import { CalendarView } from "@brc/views/CalendarView/calendarView";
import { ROUTES } from "@routes/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

export const Calendar = (): JSX.Element => {
  return <CalendarView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.CALENDAR)) {
    return { notFound: true };
  }

  return {
    props: {
      ...BRC_PAGE_META.CALENDAR,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Calendar;

Calendar.Main = StyledPagesMain;
