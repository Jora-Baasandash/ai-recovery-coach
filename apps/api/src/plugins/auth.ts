import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    signAuthCookie: (reply: FastifyReply, userId: string) => Promise<void>;
    clearAuthCookie: (reply: FastifyReply) => void;
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: env.jwtExpiresIn },
    cookie: {
      cookieName: env.cookieName,
      signed: false,
    },
  });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ error: "Unauthorized" });
      }
    },
  );

  app.decorate(
    "signAuthCookie",
    async (reply: FastifyReply, userId: string) => {
      const token = await reply.jwtSign({ sub: userId });
      reply.setCookie(env.cookieName, token, {
        path: "/",
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: env.cookieMaxAgeSeconds,
      });
    },
  );

  app.decorate("clearAuthCookie", (reply: FastifyReply) => {
    reply.clearCookie(env.cookieName, { path: "/" });
  });
});
