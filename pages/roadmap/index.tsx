import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return { redirect: { destination: "/about/roadmap", permanent: true } };
};

export default function Roadmap(): null {
  return null;
}
