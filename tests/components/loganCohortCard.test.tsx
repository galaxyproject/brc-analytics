import { LoganCohortCard } from "@repo/shared/views/AssistantView/components/LoganCohortCard/loganCohortCard";
import { render, screen } from "@testing-library/react";

const LOGAN = {
  in_mirror: 17629,
  job_id: "fe6f66a714dcbec8",
  results_url: "/logan-search?job=fe6f66a714dcbec8",
  top_organism: "Plasmodium falciparum",
  top_organism_share: 0.821,
  total_matches: 17629,
};

describe("LoganCohortCard", () => {
  it("shows the job, the counts, the top organism, and a results link", () => {
    render(<LoganCohortCard logan={LOGAN} />);
    expect(screen.getByText(/fe6f66a714dcbec8/)).toBeTruthy();
    expect(screen.getByText(/17,629 runs/)).toBeTruthy();
    expect(screen.getByText(/Plasmodium falciparum/)).toBeTruthy();
    expect(screen.getByText(/82%/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /view results/i }).getAttribute("href")
    ).toBe("/logan-search?job=fe6f66a714dcbec8");
  });

  it("copes without a cohort", () => {
    render(
      <LoganCohortCard
        logan={{
          ...LOGAN,
          in_mirror: 0,
          top_organism: null,
          top_organism_share: null,
        }}
      />
    );
    expect(screen.getByText(/metadata unavailable/i)).toBeTruthy();
  });
});
