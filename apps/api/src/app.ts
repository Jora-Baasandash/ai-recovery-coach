import Fastify from "fastify";
import { assertRequiredEnv } from "./env.js";
import { authPlugin } from "./plugins/auth.js";
import { corsPlugin } from "./plugins/cors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { checkInRoutes } from "./routes/check-ins.js";
import { healthRoutes } from "./routes/health.js";
import { statsRoutes } from "./routes/stats.js";

export async function buildApp() {
  assertRequiredEnv();

  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(statsRoutes);
  await app.register(checkInRoutes);

  return app;
}
