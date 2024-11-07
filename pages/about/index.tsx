import { smokeLightest } from "@databiosphere/findable-ui/lib/theme/common/palette";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AboutView } from "../../app/views/AboutView/aboutView";

export const About = (): JSX.Element => {
  return <AboutView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "About",
      themeOptions: {
        palette: { background: { default: smokeLightest } },
      },
    },
  };
};

export default About;

About.Main = StyledPagesMain;
