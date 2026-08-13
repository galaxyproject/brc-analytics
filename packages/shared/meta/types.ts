import { type ThemeOptions } from "@mui/material";

/**
 * Page metadata (description and title).
 */
export interface PageMeta {
  pageDescription: string;
  pageTitle: string;
}

/**
 * Static props for a page that overrides MUI theme options (e.g. the page
 * background) alongside its metadata.
 */
export interface ThemedPageProps extends PageMeta {
  themeOptions: ThemeOptions;
}
