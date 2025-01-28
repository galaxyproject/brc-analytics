interface GalaxyEnvironment {
  workflowLandingsApiUrl: string;
  workflowLandingUrlPrefix: string;
}

export const GALAXY_ENVIRONMENT: GalaxyEnvironment =
  process.env.NEXT_PUBLIC_GALAXY_ENV === "PROD"
    ? {
        workflowLandingUrlPrefix:
          "https://galaxyproject.org/workflow_landings/",
        workflowLandingsApiUrl:
          "https://test.galaxyproject.org/api/workflow_landings",
      }
    : {
        workflowLandingUrlPrefix:
          "https://test.galaxyproject.org/workflow_landings/",
        workflowLandingsApiUrl:
          "https://test.galaxyproject.org/api/workflow_landings",
      };
