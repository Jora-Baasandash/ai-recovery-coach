import fp from "fastify-plugin";
import { createInsightGenerator } from "../llm/create-generator.js";
import type { InsightGenerator } from "../llm/types.js";

declare module "fastify" {
  interface FastifyInstance {
    insights: InsightGenerator;
  }
}

export const llmPlugin = fp(async (app) => {
  app.decorate("insights", createInsightGenerator());
});
