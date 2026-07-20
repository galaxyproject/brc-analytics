import { NextPageContext } from "next";
import Error, { ErrorProps } from "next/error";
import { JSX } from "react";

/**
 * Custom error page. GA2 has no Sentry, so this
 * just renders the default Next error page.
 * @param props - Error props containing the status code.
 * @returns Error component.
 */
function CustomErrorComponent(props: ErrorProps): JSX.Element {
  return <Error statusCode={props.statusCode} />;
}

CustomErrorComponent.getInitialProps = async (
  contextData: NextPageContext
): Promise<ErrorProps> => {
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
