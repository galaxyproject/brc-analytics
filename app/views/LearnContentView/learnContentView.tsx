import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";

export const LearnContentView = (props: StaticProps): JSX.Element => {
  return (
    <Fragment>
      <h1>{props.pageTitle}</h1>
    </Fragment>
  );
};
