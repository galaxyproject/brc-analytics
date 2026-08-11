import Head from "next/head";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return (
    <Head>
      <meta httpEquiv="refresh" content="0;url=/about/roadmap" />
    </Head>
  );
};

export default Page;
