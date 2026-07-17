import { ROUTES } from "@brc-analytics/core/routes/constants";
import { JSX } from "react";

// Placeholder home for the scaffolded BRC app. Imports from @brc-analytics/core
// to verify the workspace/core alias resolves; real pages migrate in later increments.
export default function Home(): JSX.Element {
  return (
    <main>
      <h1>BRC Analytics</h1>
      <p>Scaffold app. Genomes route: {ROUTES.GENOMES}</p>
    </main>
  );
}
