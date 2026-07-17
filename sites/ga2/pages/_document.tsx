import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from "@mui/material-nextjs/v16-pagesRouter";
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { JSX } from "react";

// TODO(Phase C content migration / #1418): re-establish the per-site <head> that the
// root pages/_document.tsx carries — favicon links, Inter / Inter Tight / Roboto Mono
// font links, and the Plausible analytics script plus its production
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN guard. Deferred: static assets migrate with page content
// and per-site prod builds are wired in the deploy ticket.
class SiteDocument extends Document<DocumentHeadTagsProps> {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          {/* Server-extract emotion/MUI critical CSS so exported HTML is styled (no FOUC). */}
          <DocumentHeadTags {...this.props} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

SiteDocument.getInitialProps = async (
  ctx: DocumentContext
): Promise<DocumentHeadTagsProps & DocumentInitialProps> => {
  return await documentGetInitialProps(ctx);
};

export default SiteDocument;
