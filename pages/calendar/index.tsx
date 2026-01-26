import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { CalendarView } from "../../app/views/CalendarView/calendarView";
import { config } from "../../app/config/config";
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
      pageTitle: "Calendar",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Calendar;

Calendar.Main = StyledPagesMain;
