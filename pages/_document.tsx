import Document, { Head, Html, Main, NextScript } from "next/document";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

if (!plausibleDomain) {
  throw new Error("NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not defined");
}

class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Roboto+Mono&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500&display=swap"
            rel="stylesheet"
          />
          <script
            data-domain={plausibleDomain}
            defer
            src="https://plausible.galaxyproject.eu/js/script.js"
          />
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
