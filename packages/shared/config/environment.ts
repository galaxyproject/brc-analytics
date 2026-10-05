/**
 * Deployment environments a site can be built for. The active environment is
 * selected at build time via NEXT_PUBLIC_ENVIRONMENT, set in the environment
 * file the build loads (site-config/<site>/<env>/.env). Note the env directory
 * name and the runtime environment may differ — an env file may declare an
 * environment it aliases (e.g. a docker build declaring "local").
 */
export const ENVIRONMENT = {
  DEV: "dev",
  LOCAL: "local",
  PROD: "prod",
} as const;

export type Environment = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

/**
 * Reads and validates the active environment from NEXT_PUBLIC_ENVIRONMENT.
 * Throws when the variable is unset or not a known environment, failing fast
 * with the list of valid values rather than letting consumers each invent
 * their own fallback behavior.
 * @returns the active environment.
 */
export function getEnvironment(): Environment {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (!isEnvironment(environment)) {
    throw new Error(
      `NEXT_PUBLIC_ENVIRONMENT must be one of ${Object.values(ENVIRONMENT).join(
        ", "
      )}; got ${
        environment === undefined ? "nothing (unset)" : `"${environment}"`
      }. The value is baked in at build time from site-config/<site>/<env>/.env, so fix the env file and rebuild via the npm build scripts.`
    );
  }
  return environment;
}

/**
 * Type guard for Environment, derived from ENVIRONMENT so it cannot drift
 * from the const.
 * @param value - Value to test.
 * @returns true if the value is a known environment.
 */
function isEnvironment(value: unknown): value is Environment {
  return Object.values(ENVIRONMENT).includes(value as Environment);
}
