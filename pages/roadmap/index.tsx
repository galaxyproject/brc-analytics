import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Roadmap(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace("/about/roadmap");
  }, [router]);

  return null;
}
