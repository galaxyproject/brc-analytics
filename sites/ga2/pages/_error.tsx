import * as Sentry from "@sentry/nextjs";
import { NextPageContext } from "next";
import Error, { ErrorProps } from "next/error";
import { JSX } from "react";

/**
 * Custom error page. Mirrors the shared _error shape, but GA2 has no Sentry
 * setup (no NEXT_PUBLIC_SENTRY_DSN, no project), so the Sentry capture below is
 * inert here — Sentry.init never runs, so captureUnderscoreErrorException is a
 * no-op. Kept for parity with BRC; drop the Sentry import (or wire GA2 Sentry)
 * as a follow-up if GA2's Sentry stance is settled.
 * @param props - Error props containing the status code.
 * @returns Error component.
 */
function CustomErrorComponent(props: ErrorProps): JSX.Element {
  return <Error statusCode={props.statusCode} />;
}

CustomErrorComponent.getInitialProps = async (
  contextData: NextPageContext
): Promise<ErrorProps> => {
  // No-op on GA2 (Sentry uninitialized); see the note above.
  await Sentry.captureUnderscoreErrorException(contextData);
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
