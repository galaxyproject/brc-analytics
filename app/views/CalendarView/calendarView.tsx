import { Fragment } from "react";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import {
  Section,
  SectionContent,
  SectionLayout,
} from "../../components/content/content.styles";
import { BREADCRUMBS } from "./common/constants";

export const CalendarView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="BRC Calendar"
        subHead="Stay updated with BRC events, webinars, and activities."
      />
      <Section border>
        <SectionLayout>
          <SectionContent>
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&amp;wkst=1&amp;bgcolor=%23ffffff&amp;ctz=America%2FChicago&amp;src=bvbrc1%40gmail.com&amp;src=da34e66d02e414db2a8adcec56c905991e440aeb4e8855e1c77a8cfd91772e60%40group.calendar.google.com&amp;src=c_69db3ea893274d3822a05a63395d29b42dd85f919bff6d055b37f6f3dda846d9%40group.calendar.google.com&amp;color=%23039BE5&amp;color=%23F09300&amp;color=%23E4C441&amp;showTz=1&amp;showCalendars=0&amp;showTabs=1&amp;showPrint=0&amp;showDate=1&amp;showNav=1&amp;showTitle=0"
              style={{ borderWidth: "0" }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
            />
          </SectionContent>
        </SectionLayout>
      </Section>
    </Fragment>
  );
};
