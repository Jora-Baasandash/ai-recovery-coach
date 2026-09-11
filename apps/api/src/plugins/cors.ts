import cors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "../env.js";

export const corsPlugin = fp(async (app) => {
  await app.register(cors, {
    origin: env.webOrigin,
    credentials: true,
  });
});
