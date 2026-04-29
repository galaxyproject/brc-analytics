import Document, { Head, Html, Main, NextScript } from "next/document";
import { JSX } from "react";

const siteConfig = process.env.NEXT_PUBLIC_SITE_CONFIG;
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const isProd = Boolean(siteConfig && siteConfig.endsWith("-prod"));

if (isProd && !plausibleDomain) {
  throw new Error(
    `NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not defined in production environment for ${siteConfig}`
  );
}

if (!isProd && plausibleDomain) {
  console.warn(
    `Plausible is enabled (domain='${plausibleDomain}') while NEXT_PUBLIC_SITE_CONFIG='${siteConfig}'.`
  );
}

class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicons/favicon-16x16.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicons/favicon-32x32.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/favicons/apple-touch-icon.png"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Roboto+Mono&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500&display=swap"
            rel="stylesheet"
          />
          {plausibleDomain && (
            <script
              data-domain={plausibleDomain}
              defer
              src="https://plausible.galaxyproject.eu/js/script.js"
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
