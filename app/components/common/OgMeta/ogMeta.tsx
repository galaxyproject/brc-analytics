import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import NextHead from "next/head";
import { useRouter } from "next/router";
import { JSX } from "react";

const DEFAULT_DESCRIPTION =
  "BRC Analytics: explore, analyze, and share genomic data across organisms using Galaxy workflows.";

interface OgMetaProps {
  pageDescription?: string;
  pageTitle?: string;
}

export const OgMeta = ({
  pageDescription,
  pageTitle,
}: OgMetaProps): JSX.Element => {
  const { config } = useConfig();
  const { asPath } = useRouter();
  const { appTitle, browserURL } = config;
  const title =
    pageTitle && pageTitle !== appTitle
      ? `${pageTitle} - ${appTitle}`
      : appTitle;
  const description = pageDescription || DEFAULT_DESCRIPTION;
  const path = asPath.split(/[?#]/)[0];
  const url = `${browserURL}${path}`;
  const image = `${browserURL}/favicons/android-chrome-512x512.png`;
  return (
    <NextHead>
      <meta key="og:title" property="og:title" content={title} />
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />
      <meta key="og:image" property="og:image" content={image} />
      <meta key="og:image:width" property="og:image:width" content="512" />
      <meta key="og:image:height" property="og:image:height" content="512" />
      <meta key="og:site_name" property="og:site_name" content={appTitle} />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:url" property="og:url" content={url} />
      <meta key="twitter:card" name="twitter:card" content="summary" />
      <meta key="twitter:image" name="twitter:image" content={image} />
    </NextHead>
  );
};
