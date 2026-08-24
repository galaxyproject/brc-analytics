import { AccountSection } from "@repo/shared/views/AccountView/components/AccountSection/accountSection";
import { render, screen } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument, toHaveTextContent, toHaveAttribute)
// aren't registered globally in this repo's jest config; the existing tsx
// test pattern here avoids them, but this suite needs them, so opt in locally.
import "@testing-library/jest-dom";

describe("AccountSection", () => {
  test("renders a spinner while loading and hides the empty state", () => {
    render(
      <AccountSection
        emptyState={<span>nothing saved</span>}
        id="analyses"
        isLoading
        title="Analyses"
      >
        <span>child</span>
      </AccountSection>
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("nothing saved")).not.toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  test("renders the error and not the empty state when loading failed", () => {
    render(
      <AccountSection
        emptyState={<span>nothing saved</span>}
        error={new Error("network down")}
        id="analyses"
        isLoading={false}
        title="Analyses"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("network down");
    expect(screen.queryByText("nothing saved")).not.toBeInTheDocument();
  });

  test("renders the empty state when there is nothing and no error", () => {
    render(
      <AccountSection
        emptyState={<span>nothing saved</span>}
        id="analyses"
        isLoading={false}
        title="Analyses"
      />
    );

    expect(screen.getByText("nothing saved")).toBeInTheDocument();
  });

  test("renders children and a count when there is content", () => {
    render(
      <AccountSection
        count={2}
        emptyState={<span>nothing saved</span>}
        id="analyses"
        isLoading={false}
        title="Analyses"
      >
        <span>child</span>
      </AccountSection>
    );

    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("nothing saved")).not.toBeInTheDocument();
  });

  test("gives the section a heading anchored by id", () => {
    render(
      <AccountSection
        emptyState={<span>none</span>}
        id="launches"
        isLoading={false}
        title="Launches"
      />
    );

    const region = screen.getByRole("region", { name: "Launches" });
    expect(region).toHaveAttribute("id", "launches");
  });
});
