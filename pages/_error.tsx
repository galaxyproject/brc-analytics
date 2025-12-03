import * as Sentry from "@sentry/nextjs";
import { NextPageContext } from "next";
import Error, { ErrorProps } from "next/error";

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
