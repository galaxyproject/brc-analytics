import { ROUTES } from "@ga2/routes/constants";
import Head from "next/head";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return (
    <Head>
      <meta httpEquiv="refresh" content={`0;url=${ROUTES.ROADMAP}`} />
    </Head>
  );
};

export default Page;
