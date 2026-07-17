import { config } from "@/config/config";
import { BRC_ROUTES } from "@/routes/constants";
import { GetStaticProps } from "next";
import Head from "next/head";
import { JSX } from "react";

export default function Roadmap(): JSX.Element {
  return (
    <Head>
      <meta httpEquiv="refresh" content="0;url=/about/roadmap" />
    </Head>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths } = config();

  if (allowedPaths && !allowedPaths.includes(BRC_ROUTES.ABOUT_ROADMAP)) {
    return { notFound: true };
  }

  return { props: {} };
};
