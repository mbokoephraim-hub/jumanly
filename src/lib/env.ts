/** Deployment environments (spec part 03, § 3.7). Unset means local development. */
export type AppEnv = "local" | "preview" | "staging" | "production";

export function appEnv(): AppEnv {
  const value = process.env.APP_ENV;
  return value === "preview" || value === "staging" || value === "production" ? value : "local";
}

/** Internal pages (/dev/…) and the demo seed only exist in local and preview. */
export function isInternalEnv(): boolean {
  const env = appEnv();
  return env === "local" || env === "preview";
}
