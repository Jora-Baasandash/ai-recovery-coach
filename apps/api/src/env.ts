const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret:
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "dev-only-jwt-secret"),
  cookieName: "access_token",
  cookieMaxAgeSeconds: COOKIE_MAX_AGE_SECONDS,
  jwtExpiresIn: "7d",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
};

export function assertRequiredEnv(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (env.nodeEnv === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
}
