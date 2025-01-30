interface GalaxyEnvironment {
  galaxyInstanceUrl: string;
}

export const GALAXY_ENVIRONMENT: GalaxyEnvironment =
  process.env.NEXT_PUBLIC_GALAXY_ENV === "PROD"
    ? {
        galaxyInstanceUrl: "https://usegalaxy.org/",
      }
    : {
        galaxyInstanceUrl: "https://test.galaxyproject.org/",
      };
