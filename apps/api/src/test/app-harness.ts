import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function resetDatabase(app: FastifyInstance): Promise<void> {
  await app.prisma.insight.deleteMany();
  await app.prisma.checkIn.deleteMany();
  await app.prisma.user.deleteMany();
}

export function authCookie(response: {
  cookies: Array<{ name: string; value: string }>;
}): { access_token: string } {
  const cookie = response.cookies.find((item) => item.name === "access_token");
  if (!cookie) {
    throw new Error("Expected access_token cookie");
  }
  return { access_token: cookie.value };
}
