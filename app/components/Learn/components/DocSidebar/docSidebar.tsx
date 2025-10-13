import Link from "next/link";
import { useRouter } from "next/router";
import { Box, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArticleIcon from "@mui/icons-material/Article";
import HelpIcon from "@mui/icons-material/Help";
import CodeIcon from "@mui/icons-material/Code";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { StyledDocSidebar } from "./docSidebar.styles";

export interface DocItem {
  icon?: string; // Optional icon identifier
  id: string;
  path: string;
  title: string;
}

export interface DocCategory {
  id: string;
  items: DocItem[];
  title: string;
}

export interface DocSidebarProps {
  categories: DocCategory[];
}

// Map of icon identifiers to icon components
const iconMap = {
  article: <ArticleIcon fontSize="small" />,
  code: <CodeIcon fontSize="small" />,
  default: <MenuBookIcon fontSize="small" />,
  help: <HelpIcon fontSize="small" />,
  tips: <TipsAndUpdatesIcon fontSize="small" />,
};

export const DocSidebar = ({ categories }: DocSidebarProps): JSX.Element => {
  const router = useRouter();
  const currentPath = router.asPath;

  // Helper function to get the appropriate icon
  const getIcon = (iconName?: string): JSX.Element => {
    if (!iconName) return iconMap.default;
    return iconMap[iconName as keyof typeof iconMap] || iconMap.default;
  };

  return (
    <StyledDocSidebar>
      <Typography
        variant="h6"
        sx={{
          color: (theme) => theme.palette.primary.main,
          fontSize: "1rem",
          fontWeight: 600,
          mb: 2,
        }}
      >
        Documentation
      </Typography>
      <nav>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <Typography className="category-title" variant="subtitle2">
                {category.title}
              </Typography>
              <ul>
                {category.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      className={`item ${
                        currentPath === item.path ? "active" : ""
                      }`}
                    >
                      <Box className="item-icon" mr={1.5}>
                        {getIcon(item.icon)}
                      </Box>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </StyledDocSidebar>
  );
};
