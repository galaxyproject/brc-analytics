import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return { redirect: { destination: "/about/roadmap", permanent: false } };
};

export default function Roadmap(): null {
  return null;
}
