import { GetStaticProps } from "next";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { config } from "../../app/config/config";
import { CalendarView } from "../../app/views/CalendarView/calendarView";
import { ROUTES } from "../../routes/constants";

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
