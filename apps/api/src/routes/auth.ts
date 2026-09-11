import type { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../lib/password.js";

const credentialsSchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    password: { type: "string", minLength: 8, maxLength: 72 },
  },
} as const;

function publicUser(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/auth/register",
    { schema: { body: credentialsSchema } },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };
      const normalizedEmail = email.trim().toLowerCase();

      const existing = await app.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      const user = await app.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await hashPassword(password),
        },
      });

      await app.signAuthCookie(reply, user.id);
      return reply.code(201).send({ user: publicUser(user) });
    },
  );

  app.post(
    "/auth/login",
    { schema: { body: credentialsSchema } },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };
      const normalizedEmail = email.trim().toLowerCase();

      const user = await app.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return reply.code(401).send({ error: "Invalid email or password" });
      }

      await app.signAuthCookie(reply, user.id);
      return { user: publicUser(user) };
    },
  );

  app.post("/auth/logout", async (_request, reply) => {
    app.clearAuthCookie(reply);
    return { ok: true };
  });
}
