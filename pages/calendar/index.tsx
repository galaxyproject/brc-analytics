import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { CalendarView } from "../../app/views/CalendarView/calendarView";

export const Calendar = (): JSX.Element => {
  return <CalendarView />;
};

export const getStaticProps: GetStaticProps = async () => {
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
