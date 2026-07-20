import { GetStaticProps } from "next";
import Head from "next/head";
import { JSX } from "react";

const Page = (): JSX.Element => {
  return (
    <Head>
      <meta httpEquiv="refresh" content="0;url=/about/roadmap" />
    </Head>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

export default Page;
