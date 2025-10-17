import { ReactNode } from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { SectionHero } from "../Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { DocSidebar } from "./components/DocSidebar/docSidebar";
import {
  BREADCRUMBS,
  DOCUMENTATION_CATEGORIES,
} from "../../views/LearnView/common/constants";
import {
  Section,
  SectionLayout,
  SectionContent,
} from "../content/content.styles";

// Styled components for content layout
const ContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(4),
  width: "100%",
}));

// Main content styling
const MainContentWrapper = styled(Box)(({ theme }) => ({
  "& code": {
    backgroundColor: theme.palette.grey[100],
    borderRadius: 3,
    fontSize: "0.9em",
    padding: theme.spacing(0.5, 1),
    wordBreak: "break-word",
  },
  "& h1": {
    [theme.breakpoints.down("md")]: {
      fontSize: "1.75rem",
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.5rem",
    },
    fontSize: "2rem",
    fontWeight: 600,
    marginBottom: theme.spacing(2),
  },
  "& h2": {
    [theme.breakpoints.down("md")]: {
      fontSize: "1.35rem",
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.25rem",
    },
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(4),
  },
  "& h3": {
    [theme.breakpoints.down("md")]: {
      fontSize: "1.15rem",
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.1rem",
    },
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(3),
  },
  "& img": {
    height: "auto",
    maxWidth: "100%",
  },
  "& pre": {
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.5),
    },
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    overflow: "auto",
    padding: theme.spacing(2),
  },
  "& table": {
    borderCollapse: "collapse",
    display: "block",
    marginBottom: theme.spacing(2),
    overflowX: "auto",
    width: "100%",
  },
  "& th": {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 600,
  },
  "& th, & td": {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
    textAlign: "left",
  },
  flex: 1,
  maxWidth: "800px",
}));

// Sidebar container
const SidebarContainer = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
  alignSelf: "flex-start",
  position: "sticky",
  top: theme.spacing(3),
  width: "260px",
}));

export interface DocLayoutProps {
  children: ReactNode;
  description?: string;
  title?: string;
}

export const DocLayout = ({
  children,
  description = "Documentation, tutorials, and resources to help you get the most out of BRC Analytics.",
  title = "Learn BRC Analytics",
}: DocLayoutProps): JSX.Element => {
  return (
    <>
      {/* Hero Section with Title and Breadcrumbs */}
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head={title}
        subHead={description}
      />

      {/* Main Content Section */}
      <Section border>
        <SectionLayout>
          <SectionContent>
            <ContentContainer>
              {/* Main Documentation Content */}
              <MainContentWrapper>{children}</MainContentWrapper>

              {/* Sidebar */}
              <SidebarContainer>
                <DocSidebar categories={DOCUMENTATION_CATEGORIES} />
              </SidebarContainer>
            </ContentContainer>
          </SectionContent>
        </SectionLayout>
      </Section>
    </>
  );
};
