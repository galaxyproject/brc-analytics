import * as Sentry from "@sentry/nextjs";
import { type NextPageContext } from "next";
import Error, { type ErrorProps } from "next/error";
import { type JSX } from "react";

/**
 * Custom error page that captures errors to Sentry.
 * @param props - Error props containing the status code.
 * @returns Error component.
 */
function CustomErrorComponent(props: ErrorProps): JSX.Element {
  return <Error statusCode={props.statusCode} />;
}

CustomErrorComponent.getInitialProps = async (
  contextData: NextPageContext
): Promise<ErrorProps> => {
  await Sentry.captureUnderscoreErrorException(contextData);
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
