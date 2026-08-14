import { ROUTES } from "@repo/shared/routes/constants";
import { buildConfigureWorkflowUrl } from "@repo/shared/routes/utils";

describe("buildConfigureWorkflowUrl", () => {
  test("fills the path and appends the trsId query parameter", () => {
    expect(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_WORKFLOW,
        "GCA_000002825_3",
        "workflow-github-com-iwc-workflows-rnaseq-pe-main-versions-v1-4"
      )
    ).toBe(
      "/data/assemblies/GCA_000002825_3/analyze/workflows?trsId=workflow-github-com-iwc-workflows-rnaseq-pe-main-versions-v1-4"
    );
  });

  test("builds the organism route", () => {
    expect(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_ORGANISM_WORKFLOW,
        "2955291",
        "workflow-id"
      )
    ).toBe("/data/organisms/2955291/analyze/workflows?trsId=workflow-id");
  });

  test("formats a raw catalog TRS ID", () => {
    expect(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_WORKFLOW,
        "GCA_000002825_3",
        "#workflow/github.com/iwc-workflows/rnaseq-pe/main/versions/v1.4"
      )
    ).toBe(
      "/data/assemblies/GCA_000002825_3/analyze/workflows?trsId=workflow-github-com-iwc-workflows-rnaseq-pe-main-versions-v1-4"
    );
  });

  test("neutralizes URL-breaking characters in the TRS ID", () => {
    expect(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_WORKFLOW,
        "GCA_000002825_3",
        "a b&c=d#e"
      )
    ).toBe(
      "/data/assemblies/GCA_000002825_3/analyze/workflows?trsId=a-b-c-d-e"
    );
  });
});
