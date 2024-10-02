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
        components: {
          MuiLink: {
            styleOverrides: {
              root: {
                color: "#28285b",
                textDecoration: "underline",
                textDecorationSkipInk: "none",
                textUnderlinePosition: "from-font",
                // eslint-disable-next-line sort-keys -- disabling key order for readability
                "&:hover": {
                  textDecoration: "none",
                },
              },
            },
          },
        },
        palette: { background: { default: smokeLightest } },
      },
    },
  };
};

export default About;

About.Main = StyledPagesMain;
