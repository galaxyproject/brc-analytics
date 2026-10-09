import { type NextPageContext } from "next";
import Error, { type ErrorProps } from "next/error";
import { type JSX } from "react";

/**
 * Custom error page that renders the default Next error page. No error-reporting
 * capture is wired here.
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
